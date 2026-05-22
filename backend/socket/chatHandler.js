const { MessageModel } = require("../models/message.model");

module.exports = (io, socket) => {
  console.log(`User ${socket.userName} connected (socket: ${socket.id})`);

  // ─── JOIN COURSE ROOM ───
  socket.on("join-course", (courseId) => {
    if (!courseId) return;
    socket.join(`course_${courseId}`);
    console.log(`${socket.userName} joined course_${courseId}`);

    // Báo cho room biết có người mới vào
    socket.to(`course_${courseId}`).emit("user-joined", {
      userId: socket.userId,
      name: socket.userName,
      role: socket.userRole,
    });
  });

  // ─── LEAVE COURSE ROOM ───
  socket.on("leave-course", (courseId) => {
    if (!courseId) return;
    socket.leave(`course_${courseId}`);

    socket.to(`course_${courseId}`).emit("user-left", {
      userId: socket.userId,
      name: socket.userName,
    });
  });

  // ─── SEND MESSAGE ───
  socket.on("send-message", async ({ courseId, content }) => {
    if (!courseId || !content || !content.trim()) return;

    try {
      const message = await MessageModel.create({
        senderId: socket.userId,
        senderName: socket.userName,
        senderRole: socket.userRole,
        courseId,
        content: content.trim(),
      });

      // Gửi cho TẤT CẢ trong room (kể cả người gửi)
      io.to(`course_${courseId}`).emit("new-message", {
        _id: message._id,
        senderId: socket.userId,
        senderName: socket.userName,
        senderRole: socket.userRole,
        content: content.trim(),
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error("Send message error:", err);
      socket.emit("message-error", { message: "Không thể gửi tin nhắn" });
    }
  });

  // ─── TYPING INDICATOR ───
  socket.on("typing", ({ courseId, isTyping }) => {
    if (!courseId) return;
    socket.to(`course_${courseId}`).emit("user-typing", {
      userId: socket.userId,
      name: socket.userName,
      isTyping,
    });
  });

  // ─── DISCONNECT ───
  socket.on("disconnect", () => {
    console.log(`User ${socket.userName} disconnected (socket: ${socket.id})`);
  });
};