const mongoose = require("mongoose");
const courseModel = require("../models/courses.model");
const { UserModel } = require("../models/users.models");

const DEFAULT_FORBIDDEN =
  "You must be enrolled in this course to access this content.";

/**
 * Same access rule as course videos: enrolled in user.course, or admin, or course teacher.
 * @param {string} userId
 * @param {string} courseId
 * @param {{ forbiddenMessage?: string }} [options]
 * @returns {Promise<{ ok: true, user: import('mongoose').Document } | { ok: false, status: number, message: string, code?: string }>}
 */
async function canUserAccessCourseContent(userId, courseId, options = {}) {
  const forbiddenMessage = options.forbiddenMessage || DEFAULT_FORBIDDEN;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { ok: false, status: 400, message: "Invalid course id" };
  }

  const user = await UserModel.findById(userId).select("course role");
  if (!user) {
    return {
      ok: false,
      status: 403,
      message: forbiddenMessage,
      code: "NOT_ENROLLED",
    };
  }

  const courseOid = new mongoose.Types.ObjectId(courseId);
  const isEnrolled = user.course.some((cid) => cid.equals(courseOid));

  let allowed = isEnrolled;
  if (!allowed && user.role === "admin") {
    allowed = true;
  }
  if (!allowed && user.role === "teacher") {
    const courseForOwner = await courseModel
      .findById(courseId)
      .select("teacherId");
    const uid = userId;
    if (
      courseForOwner &&
      courseForOwner.teacherId &&
      courseForOwner.teacherId.equals(uid)
    ) {
      allowed = true;
    }
  }

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      message: forbiddenMessage,
      code: "NOT_ENROLLED",
    };
  }

  return { ok: true, user };
}

module.exports = { canUserAccessCourseContent };
