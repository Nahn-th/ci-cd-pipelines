const express = require("express");
const courseModel = require("../models/courses.model");
const { auth } = require("../middlewares/users.middleware");
const { UserModel } = require("../models/users.models.js");

const courseRoute = express.Router();

// Public route - only show published courses
// Supports optional ?category=Business filter
courseRoute.get("/all", async (req, res) => {
  try {
    let { q, sortBy, sortOrder, page, limit, category } = req.query;
    let filter = { status: "published" };
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    const course = await courseModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

courseRoute.use(auth);
// Protected Routes

// get request for all courses
// EndPoint: /courses/
// Admin: sees all courses (pending + published + rejected)
// Teacher: sees only their own courses (all statuses)
// Others (user): sees only published courses
courseRoute.get("/", async (req, res) => {
  try {
    let { q, sortBy, sortOrder, page, limit } = req.query;
    let filter = {};

    if (req.body.role === "admin") {
      // Admin sees all - no status filter
    } else if (req.body.role === "teacher") {
      // Teacher sees only their own courses (all statuses)
      filter.teacherId = req.body.userId;
    } else {
      // Regular user or others only see published courses
      filter.status = "published";
    }

    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    const course = await courseModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// Get pending courses for admin review
courseRoute.get("/pending", async (req, res) => {
  try {
    if (req.body.role !== "admin") {
      return res.status(401).json({ error: "Only admin can view pending courses" });
    }
    let { q, sortBy, sortOrder, page, limit } = req.query;
    let filter = { status: "pending" };
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    const course = await courseModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

courseRoute.get("/TeacherCourses", async (req, res) => {
  try {
    let { q, sortBy, sortOrder, page, limit, userId } = req.query;
    let filter = {};
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    // Add filter for userId
    if (userId) {
      filter.teacherId = userId;
    }
    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    page = page ? page : 1;
    limit = limit ? limit : 10;
    const course = await courseModel
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json({ course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// get request indivual course
// EndPoint: /courses/:courseID
// FRONTEND: when user or admin want to access a specific course
courseRoute.get("/:courseID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const course = await courseModel.findOne({ _id: courseID });
    res.status(200).json({ course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// adding new course
// Access: Admin & teacher
// EndPoint: /courses/add;
// FRONTEND: when teacher want to add his/ her new course
// Teacher creates: status = pending (needs admin approval)
// Admin creates: status = published
courseRoute.post("/add", async (req, res) => {
  try {
    if (req.body.role == "admin" || req.body.role == "teacher") {
      const { title, teacher } = req.body;
      const course = await courseModel.find({ title, teacher });
      if (course.length) {
        res.status(403).json({ message: "Course Already Present" });
      } else {
        let data = req.body;
        // Teacher creates with pending status, admin creates published
        const status = req.body.role === "admin" ? "published" : "pending";
        const newCourse = new courseModel({
          ...data,
          teacher: req.body.username,
          teacherId: req.body.userId,
          status
        });
        await newCourse.save();
        const msg = req.body.role === "admin"
          ? "Course Added"
          : "Course Created! Waiting for admin approval.";
        res.status(201).json({ message: msg, data: newCourse });
      }
    } else {
      res.status(401).json({ error: "you don't have access to add course" });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// Admin approve course
// EndPoint: /courses/approve/:courseID
courseRoute.patch("/approve/:courseID", async (req, res) => {
  try {
    if (req.body.role !== "admin") {
      return res.status(401).json({ error: "Only admin can approve courses" });
    }
    const courseID = req.params.courseID;
    const course = await courseModel.findByIdAndUpdate(
      { _id: courseID },
      { status: "published" },
      { new: true }
    );
    if (!course) {
      res.status(404).json({ message: "course not found" });
    } else {
      res.status(200).json({ message: "Course approved and published", course });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// Admin reject course
// EndPoint: /courses/reject/:courseID
courseRoute.patch("/reject/:courseID", async (req, res) => {
  try {
    if (req.body.role !== "admin") {
      return res.status(401).json({ error: "Only admin can reject courses" });
    }
    const courseID = req.params.courseID;
    const course = await courseModel.findByIdAndUpdate(
      { _id: courseID },
      { status: "rejected" },
      { new: true }
    );
    if (!course) {
      res.status(404).json({ message: "course not found" });
    } else {
      res.status(200).json({ message: "Course rejected", course });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// updating course details;
// Access: Admin & teacher;
// EndPoint: /courses/update/:courseID;
// FRONTEND: when teacher want to update his existing course
courseRoute.patch("/update/:courseID", async (req, res) => {
  try {
    if (req.body.role == "admin" || req.body.role == "teacher") {
      const courseID = req.params.courseID;
      const course = await courseModel.findByIdAndUpdate(
        { _id: courseID },
        req.body
      );
      if (!course) {
        res.status(404).json({ message: "course not found" });
      } else {
        res.status(202).json({ message: "course updated", course });
      }
    } else {
      res.status(401).json({ error: "you don't have access to update course" });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// course delete request;
// Access: Admin & teacher;
// EndPoint: /courses/delete/:courseID;
// FRONTEND: when admin/teacher want to delete his existing courses
courseRoute.delete("/delete/:courseID", async (req, res) => {
  try {
    if (req.body.role == "admin" || req.body.role == "teacher") {
      const courseID = req.params.courseID;
      const course = await courseModel.findByIdAndDelete({ _id: courseID });
      if (!course) {
        res.status(404).json({ message: "course not found" });
      } else {
        res.status(200).json({ message: "course deleted", course });
      }
    } else {
      res
        .status(401)
        .json({ error: "you don't have access to delete the course" });
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

module.exports = { courseRoute };