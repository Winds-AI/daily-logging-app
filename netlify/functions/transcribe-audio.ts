import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const audioModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { audioData, mimeType } = JSON.parse(event.body || '{}');

    if (!audioData || !mimeType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Audio data and MIME type are required' }),
      };
    }

    // Convert base64 back to Uint8Array
    const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

    const audioPart = {
      inlineData: {
        data: Buffer.from(audioBytes).toString('base64'),
        mimeType: mimeType,
      },
    };

    const result = await audioModel.generateContent([audioPart, "Transcribe this audio."]);
    const transcription = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ transcription }),
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to transcribe audio' }),
    };
  }
};

