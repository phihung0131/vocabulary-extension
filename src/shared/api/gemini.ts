/**
 * Google Gemini AI API client
 * For generating collocations
 */

import { post } from './client';
import { retrieveApiKey } from '../security/keychain';
import type { Collocation } from '../types/models';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

/**
 * Generate collocations for a list of words using Gemini AI
 * @param words - Array of words to generate collocations for
 * @returns Array of generated collocations
 */
export async function generateCollocations(words: string[]): Promise<Collocation[]> {
  const apiKey = await retrieveApiKey();

  if (!apiKey) {
    throw new Error('AI API Key not configured');
  }

  const prompt = buildPrompt(words);

  const response = await post<GeminiResponse>(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    },
    { timeout: 60000, retries: 1 } // Longer timeout for AI generation
  );

  return parseGeminiResponse(response);
}

/**
 * Build the prompt for Gemini AI
 */
function buildPrompt(words: string[]): string {
  return `
Tạo collocations cho danh sách từ sau: ${words.map(w => `"${w}"`).join(', ')}

Yêu cầu chi tiết:
1. Xử lý từng từ:
   - Nếu là động từ/danh từ không ở dạng nguyên mẫu, chuyển về dạng nguyên mẫu
   - Nếu là một collocation, giữ nguyên

2. Với mỗi từ/cụm từ, tạo:
   - 1-5 collocations phổ biến nhất trong IELTS hoặc giao tiếp hằng ngày
   - Nghĩa Việt phải chính xác, ngắn gọn
   - IPA chuẩn xác cho mỗi collocation
   - Từ đồng nghĩa (nếu có)

3. Trả về JSON có cấu trúc:
{
    "results": [
        {
            "collocation": "strong coffee",
            "ipa": "/strɒŋ ˈkɒfi/",
            "meaning": "cà phê đậm đà",
            "synonyms": "intense coffee, robust coffee"
        }, ...
    ]
}

4. Lưu ý:
- Collocations phải thực tế, có tần suất sử dụng cao
- IPA cần bao gồm trọng âm và phụ âm
- Nghĩa tiếng Việt phải tự nhiên, dễ hiểu
- Loại bỏ hoàn toàn các giải thích, chú thích khác - chỉ giữ lại JSON
`;
}

/**
 * Parse Gemini AI response and extract collocations
 */
function parseGeminiResponse(response: GeminiResponse): Collocation[] {
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from AI');
  }

  try {
    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.results || !Array.isArray(parsed.results)) {
      throw new Error('Invalid response format from AI');
    }

    return parsed.results;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', text);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Test AI API connection
 * @returns true if API key is valid
 */
export async function testAIConnection(): Promise<boolean> {
  try {
    const apiKey = await retrieveApiKey();

    if (!apiKey) {
      return false;
    }

    const response = await post<GeminiResponse>(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: "Say 'OK'" }],
          },
        ],
      },
      { timeout: 10000, retries: 0 }
    );

    return !!response.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    return false;
  }
}
