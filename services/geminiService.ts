
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyInfo, AdContent } from "../types";

export const generateAdContent = async (
  productImageBase64: string,
  companyInfo: CompanyInfo
): Promise<AdContent> => {
  // Khởi tạo AI trực tiếp với biến môi trường từ Vercel
  // Lưu ý: Key phải được đặt tên chính xác là API_KEY trong phần Environment Variables của Vercel
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình trên Vercel!");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Bạn là một chuyên gia viết nội dung quảng cáo (Content Creator) hàng đầu tại Việt Nam.
    Hãy phân tích hình ảnh sản phẩm đính kèm và tạo một bài viết quảng cáo hấp dẫn.
    
    Thông tin thương hiệu:
    - Tên công ty: ${companyInfo.name}
    - Hotline: ${companyInfo.hotline}
    - Địa chỉ: ${companyInfo.address}
    
    Yêu cầu:
    1. Tiêu đề (headline) hấp dẫn, kích thích mua hàng.
    2. Nội dung (body) sáng tạo, nhấn mạnh vào giá trị sản phẩm dựa trên hình ảnh.
    3. Hashtags phù hợp xu hướng.
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: productImageBase64.split(",")[1],
    },
  };

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
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

  return JSON.parse(response.text);
};
