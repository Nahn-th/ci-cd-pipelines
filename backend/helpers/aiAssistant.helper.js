require('dotenv').config();
const fs = require('fs');
const path = require('path');

let ai = null;
try {
  const { GoogleGenAI } = require('@google/genai');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'fillyourkeyhere') {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('AI Assistant: Gemini client initialized successfully');
  } else {
    console.warn('AI Assistant: GEMINI_API_KEY not configured. AI features will use fallback mode.');
  }
} catch (err) {
  console.error('AI Assistant: Failed to initialize Gemini client:', err.message);
}
/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text from PDF
 */
async function extractTextFromPDF(filePath) {
  try {
    const pdfParse = require('pdf-parse');
    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Load or read course material context
 * For production, this could read from database or file system
 *
 * @param {string} courseId - Course ID to fetch context for
 * @returns {Promise<string>} Course material context
 */
async function loadCourseContext(courseId) {
  try {
    // Option 1: Read from file system (if PDF is stored)
    // const pdfPath = path.join(__dirname, `../uploads/courses/${courseId}/material.pdf`);
    // if (fs.existsSync(pdfPath)) {
    //   return await extractTextFromPDF(pdfPath);
    // }

    // Option 2: Read from a text file (demo data)
    const contextPath = path.join(__dirname, `../data/course_${courseId}.txt`);
    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf-8');
    }

    // Option 3: Return demo context if no file found
    return getDemoContext();
  } catch (error) {
    console.error('Error loading course context:', error.message);
    return getDemoContext();
  }
}

/**
 * Demo context for development/testing
 * Replace this with actual course material in production
 */
function getDemoContext() {
  return `
    KHÓA HỌC: JAVASCRIPT CƠ BẢN

    ## Chương 1: Giới thiệu JavaScript
    - JavaScript là ngôn ngữ lập trình được chạy trên trình duyệt web.
    - Được sáng lập bởi Brendan Eich vào năm 1995.
    - JavaScript không liên quan gì đến Java.

    ## Chương 2: Các kiểu dữ liệu cơ bản
    - Number: Các số nguyên và số thực (VD: 10, 3.14)
    - String: Chuỗi ký tự (VD: "Hello World")
    - Boolean: true hoặc false
    - Undefined: Biến chưa được gán giá trị
    - Null: Biến được gán giá trị null
    - Object: Tập hợp các cặp key-value
    - Array: Mảng chứa nhiều phần tử

    ## Chương 3: Biến và hằng số
    - var: Cách khai báo cũ (tránh sử dụng)
    - let: Khai báo biến trong phạm vi block
    - const: Khai báo hằng số không thể thay đổi

    ## Chương 4: Hàm (Functions)
    - Định nghĩa hàm bằng function keyword
    - Arrow function: Cách viết ngắn gọn (VD: const sum = (a, b) => a + b)
    - Hàm có thể nhận tham số và trả về giá trị

    ## Chương 5: DOM (Document Object Model)
    - DOM là cây cấu trúc của trang HTML
    - document.querySelector() để chọn phần tử
    - document.getElementById() để chọn theo ID
    - addEventListener() để lắng nghe sự kiện

    ## Chương 6: Async/Await
    - Cho phép xử lý các tác vụ bất đồng bộ
    - async function trả về Promise
    - await chờ Promise hoàn thành
  `;
}

/**
 * Build system prompt for RAG with context scoping
 * This ensures AI only answers based on provided context
 *
 * @param {string} courseContext - The course material text
 * @returns {string} System prompt
 */
function buildSystemPrompt(courseContext) {
  return `Bạn là một AI Assistant hỗ trợ học tập cho khóa học E-learning.

HƯỚNG DẪN QUAN TRỌNG:
1. Bạn CHỈ được phép trả lời các câu hỏi dựa trên nội dung khóa học được cung cấp dưới đây.
2. NẾU câu hỏi nằm NGOÀI phạm vi nội dung khóa học, bạn PHẢI trả lời:
   "Xin lỗi, kiến thức này không nằm trong nội dung khóa học. Vui lòng tham khảo giáo viên hoặc tài liệu khác."
3. Trả lời ngắn gọn, rõ ràng, dễ hiểu cho học sinh.
4. Sử dụng tiếng Việt và giải thích bằng ví dụ cụ thể khi có thể.
5. Nếu không chắc chắn, hãy nói rõ rằng kiến thức đó không được đề cập trong khóa học.

NỘI DUNG KHÓA HỌC:
===================
${courseContext}
===================

Bây giờ hãy trả lời câu hỏi của học sinh dựa STRICTLY trên nội dung trên.`;
}

/**
 * Check if user response is within course context
 * Uses semantic analysis to validate response relevance
 *
 * @param {string} question - User question
 * @param {string} answer - AI generated answer
 * @param {string} courseContext - Course material context
 * @returns {boolean} Whether answer is within context
 */
function isAnswerWithinContext(question, answer, courseContext) {
  // Check if answer contains explicit "out of scope" message
  const outOfScopePatterns = [
    'không nằm trong nội dung',
    'outside of course content',
    'not covered in this course',
    'kiến thức này không được đề cập',
  ];

  const isExplicitlyOutOfScope = outOfScopePatterns.some(pattern =>
    answer.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isExplicitlyOutOfScope) {
    return false;
  }

  // Simple heuristic: check if answer relates to context keywords
  const contextWords = courseContext.toLowerCase().split(/\s+/);
  const answerWords = answer.toLowerCase().split(/\s+/);

  // Count how many answer words appear in context
  const matchingWords = answerWords.filter(word =>
    word.length > 3 && contextWords.includes(word)
  ).length;

  // If less than 20% of answer words match context, it's likely out of scope
  const relevanceRatio = answerWords.length > 0 ? matchingWords / answerWords.length : 0;

  return relevanceRatio >= 0.2 || matchingWords > 5;
}

/**
 * Extract text from Gemini v2 SDK response
 * Supports both streaming and non-streaming response formats
 */
function extractResponseText(response) {
  // Format 1: response.text (some SDK versions)
  if (response && typeof response.text === 'string' && response.text.trim()) {
    return response.text;
  }
  // Format 2: response.candidates[0].content.parts[0].text (v2 SDK)
  if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.candidates[0].content.parts[0].text;
  }
  // Format 3: nested response
  if (response?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return response.response.candidates[0].content.parts[0].text;
  }
  return "";
}

/**
 * Main function to query AI Assistant with RAG
 *
 * @param {string} courseId - Course ID
 * @param {string} userQuestion - User's question
 * @returns {Promise<{response: string, isWithinContext: boolean}>} AI response
 */
async function queryAIAssistant(courseId, userQuestion) {
  try {
    // Check if AI client is available
    if (!ai) {
      return {
        response: 'Xin lỗi, AI Assistant chưa được cấu hình. Vui lòng liên hệ quản trị viên để thiết lập GEMINI_API_KEY.',
        isWithinContext: false,
        tokens: 0,
      };
    }

    // Load course context
    const courseContext = await loadCourseContext(courseId);

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(courseContext);

    // Gọi Gemini 2.5 Flash
    const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userQuestion,
          config: {
            systemInstruction: systemPrompt,
            // Cấu hình nhiệt độ (thấp = bám sát context hơn, ít bịa đặt)
            temperature: 0.7,
          }
        });

    const aiAnswer = extractResponseText(response);

    if (!aiAnswer) {
      return {
        response: 'Xin lỗi, không nhận được phản hồi từ AI. Vui lòng thử lại sau.',
        isWithinContext: false,
        tokens: 0,
      };
    }

    // Validate if answer is within context
    const isWithinContext = isAnswerWithinContext(
      userQuestion,
      aiAnswer,
      courseContext
    );

    // Force the out-of-scope message if not within context
    let finalAnswer = aiAnswer;
    if (!isWithinContext && !aiAnswer.toLowerCase().includes('không nằm trong') && !aiAnswer.toLowerCase().includes('không được đề cập')) {
      finalAnswer = 'Xin lỗi, kiến thức này không nằm trong nội dung khóa học. Vui lòng tham khảo giáo viên hoặc tài liệu khác.';
    }

    return {
      response: finalAnswer,
      isWithinContext: isWithinContext || aiAnswer.toLowerCase().includes('không nằm trong') || aiAnswer.toLowerCase().includes('không được đề cập'),
      tokens: 0,
    };
  } catch (error) {
    console.error('Error querying AI Assistant:', error.message);
    throw new Error(`AI Assistant Error: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF,
  loadCourseContext,
  queryAIAssistant,
  buildSystemPrompt,
  isAnswerWithinContext,
};
