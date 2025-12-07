import { HistoricalPlace, GeoLocation } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || process.env.API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Função para chamar a API do Groq
async function callGroqAPI(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('API_KEY_MISSING');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Modelo rápido e gratuito do Groq
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

export async function fetchHistoricalContext(
  lat: number,
  lng: number,
  drivingMode: boolean = false
): Promise<{ text: string; places: HistoricalPlace[]; highlight?: string }> {
  const prompt = `Você é um guia turístico especializado em São Paulo, Brasil.

Localização atual: ${lat}, ${lng}

${drivingMode
      ? 'MODO DIREÇÃO: Forneça UMA curiosidade histórica curta (máximo 2 frases) sobre algo interessante próximo a esta localização.'
      : 'Forneça informações históricas interessantes sobre esta área de São Paulo. Inclua 2-3 lugares históricos próximos com suas coordenadas aproximadas.'
    }

${!drivingMode ? `
Formato da resposta (JSON):
{
  "text": "Descrição histórica da área",
  "places": [
    {
      "id": "unique-id",
      "title": "Nome do lugar",
      "description": "Breve descrição",
      "location": {"lat": -23.xxx, "lng": -46.xxx}
    }
  ]
}` : ''}`;

  try {
    const responseText = await callGroqAPI(prompt);

    if (drivingMode) {
      // Modo direção: retorna apenas texto curto
      return {
        text: '',
        places: [],
        highlight: responseText.trim()
      };
    }

    // Modo normal: tenta parsear JSON
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || responseText,
          places: (parsed.places || []).map((p: any, index: number) => ({
            id: p.id || `place-${Date.now()}-${index}`,
            title: p.title || 'Lugar Histórico',
            description: p.description || '',
            location: p.location || { lat, lng }
          })),
          highlight: parsed.highlight
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON, using raw text');
    }

    // Fallback: retorna texto bruto
    return {
      text: responseText,
      places: [],
    };
  } catch (error) {
    console.error('Error fetching historical context:', error);
    throw error;
  }
}

export async function generateVoiceNarration(text: string): Promise<AudioBuffer> {
  // Groq não tem API de voz nativa, mas podemos usar Web Speech API do navegador (gratuito!)
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Usar Web Speech API para síntese de voz (gratuito, nativo do navegador)
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Criar um buffer de áudio vazio (Web Speech API não retorna AudioBuffer diretamente)
      // Esta é uma implementação simplificada - em produção, você poderia gravar o áudio
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);

      utterance.onend = () => {
        resolve(buffer);
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        reject(error);
      };

      // Reproduzir usando Web Speech API
      window.speechSynthesis.speak(utterance);

      // Retornar buffer vazio imediatamente (a fala acontece em paralelo)
      setTimeout(() => resolve(buffer), 100);
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateEmailItinerary(places: HistoricalPlace[]): Promise<string> {
  if (places.length === 0) {
    return 'Você ainda não visitou nenhum lugar histórico.';
  }

  const placesText = places.map((p, i) =>
    `${i + 1}. ${p.title}\n   ${p.description || 'Sem descrição'}\n   Localização: ${p.location.lat}, ${p.location.lng}`
  ).join('\n\n');

  const prompt = `Crie um roteiro de email amigável e informativo baseado nestes lugares históricos de São Paulo visitados:

${placesText}

Formato: Email casual e interessante, com introdução, lista dos lugares com curiosidades, e conclusão motivadora.`;

  try {
    const emailBody = await callGroqAPI(prompt);
    return emailBody;
  } catch (error) {
    console.error('Error generating email:', error);
    return `Roteiro de São Paulo\n\n${placesText}`;
  }
}