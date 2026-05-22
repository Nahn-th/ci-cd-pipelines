require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("LỖI: Biến MONGODB_URI không tồn tại trong file .env!");
  process.exit(1);
}

function connectDB() {
  return mongoose.connect(mongoURI);
}

const db = mongoose.connection;

db.on("error", (error) => console.error("MongoDB Connection Error:", error));
db.once("open", async () => {
  console.log("--- Đã kết nối thành công tới MongoDB ---");
  try {
    const { QuizModel } = require("./models/quiz.model");
    await QuizModel.syncIndexes();
    console.log("--- Đã đồng bộ index collection quiz với schema (bỏ index thừa / unique cũ) ---");
  } catch (e) {
    console.warn("QuizModel.syncIndexes:", e.message);
  }
});

module.exports = { connectDB, db };
