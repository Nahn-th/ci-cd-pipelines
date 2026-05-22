const express = require("express");
const mongoose = require("mongoose");
const { auth } = require("../middlewares/users.middleware");
const { CertificateModel } = require("../models/certificate.model");
const courseModel = require("../models/courses.model");
const { UserModel } = require("../models/users.models");
const { SubmissionModel } = require("../models/submission.model");
const { sendCertificateEmail } = require("../utils/emailService");

const certificateRouter = express.Router();

certificateRouter.use(auth);

/**
 * Generate a unique certificate ID
 */
function generateCertificateId() {
  const prefix = "CERT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique certificate number (sequential-like)
 */
function generateCertificateNumber() {
  const prefix = "EL";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * POST /certificate/issue/:courseId
 * Issue a certificate for a user who completed the course.
 * Requirements:
 *  - User must be enrolled in the course
 *  - User must have submitted quizzes for all videos in the course
 *  - Average quiz score across all submissions must be >= 80%
 *  - Certificate must not already exist for this user + course
 */
certificateRouter.post("/issue/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.body.userId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check if certificate already exists
    const existing = await CertificateModel.findOne({ userId, courseId });
    if (existing) {
      return res.status(409).json({
        message: "Certificate already issued for this course.",
        certificate: existing,
      });
    }

    // Check enrollment
    const user = await UserModel.findById(userId).select("course name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const courseOid = new mongoose.Types.ObjectId(courseId);
    const isEnrolled = user.course.some((cid) => cid.equals(courseOid));
    if (!isEnrolled) {
      return res.status(403).json({
        message: "You must be enrolled in this course to receive a certificate.",
      });
    }

    // Get course details
    const course = await courseModel.findById(courseId).select("title videos");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if course has videos
    if (!course.videos || course.videos.length === 0) {
      return res.status(400).json({
        message: "This course has no videos, cannot issue certificate.",
      });
    }

    // Get all submissions for this user in this course
    const submissions = await SubmissionModel.find({ userId, courseId });

    // Check if there are submissions covering all videos
    const uniqueVideoIds = new Set(
      submissions.map((s) => s.videoId.toString())
    );
    const allVideoIds = new Set(
      course.videos.map((v) => v.toString())
    );

    // For each video, check if at least one submission exists
    let allVideosSubmitted = true;
    let totalScore = 0;
    let totalSubmissions = 0;

    for (const videoId of allVideoIds) {
      const videoSubmissions = submissions.filter(
        (s) => s.videoId.toString() === videoId
      );
      if (videoSubmissions.length === 0) {
        allVideosSubmitted = false;
      } else {
        // Take the best score for each video
        const bestScore = Math.max(
          ...videoSubmissions.map((s) => s.score)
        );
        totalScore += bestScore;
        totalSubmissions++;
      }
    }

    if (!allVideosSubmitted || totalSubmissions === 0) {
      return res.status(400).json({
        message:
          "You must complete quizzes for all videos in this course to earn a certificate.",
        completedVideos: uniqueVideoIds.size,
        totalVideos: allVideoIds.size,
      });
    }

    // Calculate average score across best scores per video
    const averageScore = Math.round(totalScore / totalSubmissions);

    if (averageScore < 80) {
      return res.status(400).json({
        message: `Your average quiz score is ${averageScore}%. You need at least 80% to earn a certificate.`,
        averageScore,
      });
    }

    // Issue certificate
    const certificate = await CertificateModel.create({
      userId,
      courseId,
      studentName: user.name || "Student",
      courseName: course.title,
      certificateId: generateCertificateId(),
      certificateNumber: generateCertificateNumber(),
      issuedDate: new Date(),
    });

    // Send congratulation email
    try {
      await sendCertificateEmail(
        user.email,
        user.name,
        course.title,
        certificate._id.toString()
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(201).json({
      message: "Certificate issued successfully!",
      certificate,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

/**
 * GET /certificate/list
 * Get all certificates for the authenticated user
 */
certificateRouter.get("/list", async (req, res) => {
  try {
    const userId = req.body.userId;
    const certificates = await CertificateModel.find({ userId }).sort({
      issuedDate: -1,
    });
    res.status(200).json({ certificates });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

/**
 * GET /certificate/:id
 * Get a single certificate by ID
 */
certificateRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid certificate ID" });
    }
    const certificate = await CertificateModel.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    // Verify ownership
    if (certificate.userId.toString() !== req.body.userId) {
      return res.status(403).json({ message: "Not authorized to view this certificate" });
    }
    res.status(200).json({ certificate });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

/**
 * GET /certificate/check/:courseId
 * Check if the user already has a certificate for a course and check eligibility
 */
certificateRouter.get("/check/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.body.userId;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Check existing certificate
    const existing = await CertificateModel.findOne({ userId, courseId });
    const hasCertificate = !!existing;

    // Get course
    const course = await courseModel.findById(courseId).select("title videos");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check enrollment
    const user = await UserModel.findById(userId).select("course name email");
    const courseOid = new mongoose.Types.ObjectId(courseId);
    const isEnrolled = user?.course.some((cid) => cid.equals(courseOid));

    // Get submission stats
    const submissions = await SubmissionModel.find({ userId, courseId });
    const uniqueVideoIds = new Set(
      submissions.map((s) => s.videoId.toString())
    );
    const allVideoIds = course.videos?.map((v) => v.toString()) || [];

    let averageScore = 0;
    let videosCompleted = 0;
    let eligible = false;

    if (submissions.length > 0 && allVideoIds.length > 0) {
      let totalScore = 0;
      for (const videoId of allVideoIds) {
        const videoSubmissions = submissions.filter(
          (s) => s.videoId.toString() === videoId
        );
        if (videoSubmissions.length > 0) {
          const bestScore = Math.max(
            ...videoSubmissions.map((s) => s.score)
          );
          totalScore += bestScore;
          videosCompleted++;
        }
      }
      averageScore = videosCompleted > 0 ? Math.round(totalScore / videosCompleted) : 0;
      eligible =
        videosCompleted === allVideoIds.length && averageScore >= 80;
    }

    res.status(200).json({
      hasCertificate,
      certificate: existing || null,
      isEnrolled: !!isEnrolled,
      courseName: course.title,
      totalVideos: allVideoIds.length,
      videosCompleted,
      averageScore,
      eligible,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = { certificateRouter };
