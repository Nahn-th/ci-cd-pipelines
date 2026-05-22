const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videos",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "quiz",
      required: true,
      index: true,
    },
    score: { type: Number, required: true },
    answers: [{ type: Number, required: true }],
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const SubmissionModel = mongoose.model("quizSubmission", submissionSchema);

module.exports = { SubmissionModel };
