
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyInfo, AdContent } from "../types";

// Hàm khởi tạo AI Client ngay lúc cần để đảm bảo lấy được API_KEY mới nhất từ process.env
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAIImage = async (prompt: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Commercial photography of ${prompt}, high-end studio lighting, 8k, professional product shot, minimalist background, no text.` }],
      },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("NO_IMAGE_DATA");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const generateAdContent = async (
  productImageBase64: string,
  companyInfo: CompanyInfo,
  style: string,
  userPrompt: string
): Promise<AdContent> => {
  try {
    const ai = getAIClient();
    const isFunny = style.includes("Mặn mòi");
    
    // Hệ thống prompt được "vắt muối" tối đa cho phong cách Mặn mòi
    const systemInstruction = isFunny 
      ? `Bạn là một "Thánh Content" mặn mòi, lầy lội, chuyên sử dụng ngôn ngữ Gen Z (ét ô ét, flex, mãi mận, keo lỳ, tâm linh, người chơi hệ...). 
         Cách viết: Dùng thơ chế, so sánh sản phẩm với những thứ khó đỡ (người yêu cũ, bữa lẩu, sổ hộ nghèo...), thả thính cực dính. 
         Mục tiêu: Đọc xong khách phải cười xỉu và chốt đơn vì sự duyên dáng.`
      : `Bạn là chuyên gia Content Marketing chuyên nghiệp, lịch sự, tập trung vào giá trị và niềm tin.`;

    const prompt = `
      Hãy viết bài quảng cáo cho: ${userPrompt}
      Thương hiệu: ${companyInfo.name} | Hotline: ${companyInfo.hotline} | Địa chỉ: ${companyInfo.address}
      Phong cách yêu cầu: ${style}.
      
      Yêu cầu trình bày:
      - Tiêu đề (headline) phải cực kỳ gây sốc và thu hút.
      - Nội dung (body) ngắt dòng hợp lý, sử dụng icon phù hợp.
      - Sử dụng dấu ● ở đầu các dòng đặc điểm nổi bật.
      
      TRẢ VỀ ĐỊNH DẠNG JSON CHÍNH XÁC:
      {
        "headline": "Tiêu đề ấn tượng",
        "body": "Nội dung bài viết",
        "hashtags": ["tag1", "tag2", "tag3"]
      }
    `;

    const parts: any[] = [{ text: prompt }];
    if (productImageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: productImageBase64.split(",")[1],
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            body: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["headline", "body", "hashtags"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Content Generation Error:", error);
    throw error;
  }
};
