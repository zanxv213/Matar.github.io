// --- IMPORTANT ---
// This file should be placed in the `api` directory at the root of your project.
// Platforms like Vercel and Netlify will automatically detect this as a serverless function.
// The name of the file (`gemini.ts`) determines the endpoint URL (`/api/gemini`).
//
// In your hosting provider's settings (e.g., Vercel dashboard), you MUST set an
// environment variable named `API_KEY` with your actual Google Gemini API key.

import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

// This is a server-side-only file. The API_KEY is safe here.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash-image-preview";

// Standard safety settings to be more permissive, can be adjusted.
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// This is the main function that will be executed when a request is made to `/api/gemini`.
export async function POST(req: Request) {
  try {
    const { parts } = await req.json();

    if (!parts) {
      return new Response(JSON.stringify({ error: "Invalid request body: missing 'parts'" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            // FIX: The Gemini API guidelines for image editing specify that only `responseModalities` is a supported config.
            // safetySettings: safetySettings,
        },
    });

    // The response from the SDK is not directly serializable, so we extract what we need.
    const simplifiedResponse = {
      candidates: response.candidates,
      promptFeedback: response.promptFeedback,
      text: response.text,
    };
    
    return new Response(JSON.stringify(simplifiedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error in Gemini API proxy:", error);
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred on the server." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}
