const API_BASE_URL = '/.netlify/functions';

export async function getSuggestionForMessage(message: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-suggestion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestion;
  } catch (error) {
    console.error('Error calling get-suggestion function:', error);
    throw error;
  }
}

export async function analyzeForSelfImprovement(message: string): Promise<{ improvement_text: string; motivational_subtitle: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-for-self-improvement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Error calling analyze-for-self-improvement function:', error);
    return null;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert audio blob to base64
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const response = await fetch(`${API_BASE_URL}/transcribe-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: audioBase64,
        mimeType: audioBlob.type,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error('Error calling transcribe-audio function:', error);
    throw error;
  }
}

