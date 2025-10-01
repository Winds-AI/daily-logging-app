import { Handler } from '@netlify/functions';
import { analyzeForSelfImprovement } from '../../services/gemini';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const analysisResult = await analyzeForSelfImprovement(message);

    if (!analysisResult) {
      return {
        statusCode: 200,
        // Return a specific structure when no goal is found
        body: JSON.stringify({ analysis: null, message: 'No improvement goal detected' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis: analysisResult }),
    };
  } catch (error) {
    console.error('Error in analyze-for-self-improvement function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};