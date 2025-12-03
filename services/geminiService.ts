import { GoogleGenAI, Modality } from "@google/genai";
import { HistoricalPlace, GeminiResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helpers for Audio Decoding
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateVoiceNarration = async (text: string): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Conte de forma breve e curiosa: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Voz mais grave e narradora
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const outputAudioContext = new AudioContext({sampleRate: 24000});
    return await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1
    );

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export const generateEmailItinerary = async (places: HistoricalPlace[]): Promise<string> => {
  if (places.length === 0) return "Nenhum local visitado para gerar roteiro.";

  const placesList = places.map(p => `- ${p.title}`).join("\n");
  
  const prompt = `
    Crie um roteiro histórico curto e convidativo em formato de texto para e-mail.
    
    Locais visitados:
    ${placesList}
    
    O e-mail deve ter:
    Assunto: Roteiro Sampa Histórica
    Corpo: Uma breve introdução poética sobre São Paulo, e depois a lista dos locais com uma frase curta sobre cada um.
    Finalize convidando para a próxima viagem.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "Roteiro indisponível.";
};

export const fetchHistoricalContext = async (
  lat: number,
  lng: number,
  isDrivingMode: boolean = false
): Promise<GeminiResult> => {
  try {
    const modelId = "gemini-2.5-flash"; 
    
    // Prompt ajustado para modo direção: mais curto e direto
    const contextPrompt = isDrivingMode 
      ? "O usuário está dirigindo. Seja EXTREMAMENTE conciso (máximo 1 frase de impacto) para a curiosidade." 
      : "O usuário está explorando a pé. Pode ser mais detalhado.";

    const prompt = `
      Estou na localização: Latitude ${lat}, Longitude ${lng} em São Paulo, Brasil.
      ${contextPrompt}
      
      TAREFA:
      1. Escolha O FATO MAIS INTERESSANTE E INUSITADO sobre um local histórico neste raio de 500m-1km.
      2. Formate a primeira linha EXATAMENTE assim:
         "DESTAQUE: [Fato curto e curioso aqui]"
      
      3. Se não estiver dirigindo, liste detalhes de 3 locais abaixo.
      
      Use a ferramenta Google Maps.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            },
          },
        },
      },
    });

    const fullText = response.text || "Sem dados históricos.";
    let highlight: string | undefined;
    let mainText = fullText;

    const highlightMatch = fullText.match(/DESTAQUE:\s*(.*?)(?:\n\n|\n|$)/s);
    if (highlightMatch && highlightMatch[1]) {
      highlight = highlightMatch[1].trim();
      mainText = fullText.replace(/DESTAQUE:.*?(?:\n\n|\n|$)/s, "").trim();
    }

    const places: HistoricalPlace[] = [];
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
      groundingChunks.forEach((chunk, index) => {
        if (chunk.maps) {
          places.push({
            id: chunk.maps.placeId || `place-${index}`,
            title: chunk.maps.title || "Local Histórico",
            description: "Identificado pelo Google Maps.", 
            location: {
              lat: lat + (Math.random() - 0.5) * 0.003, 
              lng: lng + (Math.random() - 0.5) * 0.003,
            },
            googleMapsUri: chunk.maps.googleMapsUriReference?.uri,
          });
        }
      });
    }

    return {
      text: mainText,
      highlight,
      places,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao consultar a inteligência histórica.");
  }
};