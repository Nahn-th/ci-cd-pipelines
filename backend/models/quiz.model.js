const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    choices: {
      type: [String],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: "Each question needs at least two choices",
      },
    },
    correctIndex: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videos",
      required: true,
      sparse: true,
      unique: true,
      index: true,
    },
    /** Denormalized from the video for convenient course-scoped queries. */
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      index: true,
    },
    title: { type: String, required: true },
    questions: {
      type: [questionSchema],
      validate: {
        validator(q) {
          return Array.isArray(q) && q.length >= 1;
        },
        message: "At least one question is required",
      },
    },
  },
  { timestamps: true, versionKey: false }
);

const QuizModel = mongoose.model("quiz", quizSchema);

module.exports = { QuizModel };
