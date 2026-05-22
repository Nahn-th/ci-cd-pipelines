const express = require("express");
const mongoose = require("mongoose");
const { auth } = require("../middlewares/users.middleware");
const { MessageModel } = require("../models/message.model");
const { canUserAccessCourseContent } = require("../helpers/courseAccess");

const chatRoute = express.Router();

chatRoute.use(auth);

/**
 * GET /chat/messages/:courseId
 * Lấy 50 tin nhắn gần nhất của khóa học
 */
chatRoute.get("/messages/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    // Kiểm tra quyền truy cập
    const access = await canUserAccessCourseContent(req.body.userId, courseId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const messages = await MessageModel.find({ courseId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Đảo ngược để tin nhắn cũ nhất ở trên cùng
    messages.reverse();

    res.status(200).json({ messages });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = { chatRoute };