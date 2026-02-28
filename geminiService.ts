
import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

let currentChat: any = null;

export const initAIChat = (menu: MenuItem[]) => {
  const availableMenu = menu.filter(item => item.available).map(item => `${item.name} (${item.category}): ${item.description || ''}`).join('\n');
  
  currentChat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are the "Indigo Barista", an expert at Indigo Coffee.
      Our available menu is:
      ${availableMenu}
      
      Help the customer choose what to order based on their mood or requests.
      Explain why in a poetic, premium, yet friendly way in Hebrew.
      
      Format your response as follows:
      1. Use a numbered list for the items if recommending specific ones.
      2. The item name should be in bold (e.g., **1. Item Name:**).
      3. Add a short, appetizing description for each.
      4. End with a friendly closing sentence in bold.
      
      Keep it short and appetizing. Focus on the experience.`,
      temperature: 0.8,
      topP: 0.95,
    }
  });
};

export const sendChatMessage = async (message: string): Promise<string> => {
  if (!currentChat) {
    throw new Error("Chat not initialized");
  }
  try {
    const response = await currentChat.sendMessage({ message });
    return response.text || "סליחה, אני עסוק מדי בהכנת קפה כרגע. נסו שוב עוד רגע!";
  } catch (error) {
    console.error("AI Error:", error);
    return "נראה שיש לנו תקלה קטנה במכונת האספרסו הדיגיטלית. בחרו משהו שטעים לכם!";
  }
};
