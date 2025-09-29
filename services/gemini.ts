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