const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middlewares/users.middleware');
const { queryAIAssistant, extractTextFromPDF } = require('../helpers/aiAssistant.helper');
const { canUserAccessCourseContent } = require('../helpers/courseAccess');

const aiAssistantRoute = express.Router();

// Multer setup
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files allowed'));
    } else {
      cb(null, true);
    }
  },
});

aiAssistantRoute.post('/ask', auth, async (req, res) => {
  try {
    const { courseId, question } = req.body;
    const userId = req.body.userId;

    if (!courseId || !question) {
      return res.status(400).json({
        message: 'Missing required fields: courseId and question',
      });
    }

    if (question.trim().length === 0) {
      return res.status(400).json({
        message: 'Question cannot be empty',
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        message: 'Question is too long (max 1000 characters)',
      });
    }

    const access = await canUserAccessCourseContent(userId, courseId, {
      forbiddenMessage: 'You must be enrolled in this course to use AI Assistant.',
    });

    if (!access.ok) {
      return res.status(access.status).json({
        message: access.message,
        ...(access.code ? { code: access.code } : {}),
      });
    }

    const result = await queryAIAssistant(courseId, question);

    res.status(200).json({
      success: true,
      question: question,
      response: result.response,
      isWithinContext: result.isWithinContext,
      tokensUsed: result.tokens,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Assistant Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process your question',
      error: error.message,
    });
  }
});

aiAssistantRoute.post('/upload-pdf', auth, upload.single('file'), async (req, res) => {
  const tempFilePath = req.file ? req.file.path : null;

  try {
    const { courseId } = req.body;
    // const { role } = req.body;
    const role = req.role || req.user?.role || req.body.role;

    if (role !== 'admin' && role !== 'teacher') {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(403).json({
        message: 'Only admin and teachers can upload course materials',
      });
    }

    if (!courseId) {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        message: 'Missing courseId',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
      });
    }

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const extractedText = await extractTextFromPDF(tempFilePath);

    const outputPath = path.join(dataDir, `course_${courseId}.txt`);
    fs.writeFileSync(outputPath, extractedText, 'utf-8');

    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(200).json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      courseId: courseId,
      filePath: outputPath,
    });
  } catch (error) {
    console.error('PDF Upload Error:', error.message);

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload and process PDF',
      error: error.message,
    });
  }
});

module.exports = { aiAssistantRoute };
