import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateUrlSummary = async (url) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const result = await model.generateContent(`Summarize this url in 1 line : ${url}`);

    return result.response.text();
  } catch (err) {
    console.error("Gemini Error:", err);
    return "No Summary Available";
  }
}
