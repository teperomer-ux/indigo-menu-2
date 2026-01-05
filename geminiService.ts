
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIRecommendation = async (mood: string, menu: MenuItem[]): Promise<string> => {
  const availableMenu = menu.filter(item => item.available).map(item => `${item.name} (${item.category}): ${item.description || ''}`).join('\n');
  
  const prompt = `
    You are the "Indigo Barista", an expert at Indigo Coffee.
    The customer is feeling: "${mood}".
    Our available menu is:
    ${availableMenu}
    
    Recommend 2 items from the menu that fit this mood. Explain why in a poetic, premium, yet friendly way in Hebrew.
    Keep it short and appetizing. Focus on the experience.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text || "סליחה, אני עסוק מדי בהכנת קפה כרגע. נסו שוב עוד רגע!";
  } catch (error) {
    console.error("AI Error:", error);
    return "נראה שיש לנו תקלה קטנה במכונת האספרסו הדיגיטלית. בחרו משהו שטעים לכם!";
  }
};
