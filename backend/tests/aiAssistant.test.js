const {
  buildSystemPrompt,
  isAnswerWithinContext,
  extractResponseText,
} = require('../ci-cd-pipelines/backend/helpers/aiAssistant.helper');

describe('AI Assistant Helper - Unit Tests', () => {
  
  // Group 1: buildSystemPrompt
  describe('buildSystemPrompt', () => {
    test('1. should return a system prompt containing the provided course context', () => {
      const mockContext = 'KHÓA HỌC: JAVASCRIPT CƠ BẢN\n- Hằng số: const';
      const prompt = buildSystemPrompt(mockContext);
      
      expect(prompt).toContain('Bạn là một AI Assistant hỗ trợ học tập');
      expect(prompt).toContain(mockContext);
      expect(prompt).toContain('HƯỚNG DẪN QUAN TRỌNG');
    });

    test('2. should handle empty course context gracefully', () => {
      const prompt = buildSystemPrompt('');
      expect(prompt).toContain('Bạn là một AI Assistant hỗ trợ học tập');
      expect(prompt).toContain('NỘI DUNG KHÓA HỌC:\n===================\n\n===================');
    });
  });

    
  // Group 2: isAnswerWithinContext    
  describe('isAnswerWithinContext', () => {
    const mockContext = `
      KHÓA HỌC: JAVASCRIPT CƠ BẢN
      - Kiểu dữ liệu Number: các số nguyên và số thực.
      - Khai báo hằng số bằng const không thể thay đổi.
      - Arrow function: const sum = (a, b) => a + b;
    `;

    test('3. should return false if the answer explicitly contains out-of-scope patterns', () => {
      const question = 'Java là gì?';
      const answer = 'Xin lỗi, kiến thức này không nằm trong nội dung khóa học. Vui lòng tham khảo giáo viên hoặc tài liệu khác.';
      
      const result = isAnswerWithinContext(question, answer, mockContext);
      expect(result).toBe(false);
    });

    test('4. should return true if the answer has a high relevance/match ratio with context words', () => {
      const question = 'Khai báo hằng số như thế nào?';
      const answer = 'Trong JavaScript cơ bản, bạn khai báo hằng số bằng const và giá trị của hằng số không thể thay đổi sau khi gán.';
      
      const result = isAnswerWithinContext(question, answer, mockContext);
      expect(result).toBe(true);
    });

    test('5. should return false if the answer has very few matching words with the context', () => {
      const question = 'Nấu cơm như thế nào?';
      const answer = 'Để nấu cơm ngon, bạn cần vo gạo sạch rồi đổ nước vừa đủ vào nồi và nhấn nút nấu.';
      
      const result = isAnswerWithinContext(question, answer, mockContext);
      expect(result).toBe(false);
    });
  });

    
  // Group 3: extractResponseText
    
  describe('extractResponseText', () => {
    test('6. should extract text from standard response.text property', () => {
      const mockResponse = {
        text: 'Hello from Gemini!'
      };
      const text = extractResponseText(mockResponse);
      expect(text).toBe('Hello from Gemini!');
    });

    test('7. should extract text from candidate structure (v2 SDK standard)', () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Hello from Gemini Candidate!' }
              ]
            }
          }
        ]
      };
      const text = extractResponseText(mockResponse);
      expect(text).toBe('Hello from Gemini Candidate!');
    });

    test('8. should extract text from nested response structure', () => {
      const mockResponse = {
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Hello from Nested Gemini!' }
                ]
              }
            }
          ]
        }
      };
      const text = extractResponseText(mockResponse);
      expect(text).toBe('Hello from Nested Gemini!');
    });

    test('9. should return empty string if the response structure is unrecognized or invalid', () => {
      const mockResponse = {
        foo: 'bar',
        invalidField: null
      };
      const text = extractResponseText(mockResponse);
      expect(text).toBe('');
    });
  });
});
