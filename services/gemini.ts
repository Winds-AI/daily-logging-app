import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const textModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
});

const audioModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

export async function getSuggestionForMessage(message: string) {
  const chatSession = textModel.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [
          {text: "You are a helpful assistant that provides reflections on messages. You will be given a message and you need to provide a reflection on it. The reflection should include the following: mood, acknowledgement, and encouragement. You should also ask a reflection question. Your response should be in JSON format with the following keys: mood, acknowledgement, encouragement, reflection_question."},
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(message);
  return result.response.text();
}

export async function transcribeAudio(audioBlob: Blob) {
    const audioBytes = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(
        new Uint8Array(audioBytes).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const audioPart = {
        inlineData: {
            data: audioBase64,
            mimeType: audioBlob.type,
        },
    };

    const result = await audioModel.generateContent([audioPart, "Transcribe this audio."]);
    return result.response.text();
}

export async function analyzeForSelfImprovement(message: string): Promise<{ improvement_text: string; motivational_subtitle: string } | null> {
  const chatSession = textModel.startChat({
    generationConfig: { ...generationConfig, responseMimeType: "application/json" },
    safetySettings,
    history: [
      {
        role: "user",
        parts: [
          { text: `You are an assistant that analyzes messages to find potential self-improvement goals.
- If a message contains a clear statement about wanting to improve on something (e.g., "I want to be more patient," "I should wake up earlier"), extract it.
- If no clear goal is stated, respond with an empty JSON object ({}).
- If a goal is found, provide a JSON response with two keys:
  1. "improvement_text": The extracted self-improvement goal, phrased as a concise action item.
  2. "motivational_subtitle": A short, encouraging subtitle (max 10 words).

Example:
User message: "I was so unproductive today, I really need to get better at managing my time."
AI response:
{
  "improvement_text": "Get better at managing my time",
  "motivational_subtitle": "Every step forward is a victory."
}`},
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(message);
  const responseText = result.response.text();

  try {
    // Handle cases where the AI returns an empty or non-JSON response
    if (!responseText.trim() || responseText.trim() === '{}') {
        return null;
    }

    const parsedJson = JSON.parse(responseText);

    // Validate that the fields exist and are non-empty strings
    if (parsedJson.improvement_text?.trim() && parsedJson.motivational_subtitle?.trim()) {
      return parsedJson;
    }

    return null; // Return null if fields are missing or empty
  } catch (error) {
    console.error("Error parsing AI response for self-improvement:", responseText, error);
    // Re-throw the error to be handled by the caller
    throw new Error("Failed to parse AI response for self-improvement.");
  }
}