import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getAI = () => {
  if (!apiKey) {
    throw new("AIzaSyCQlOH3KAEPdb1sZ96NyozbfIUDNLvNI1E
 is set");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateCaption(context: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Napiš kreativní, chytlavý popisek pro příspěvek na sociální síti o tématu: "${context}". Max 2 věty, přidej relevantní emojis a 3 hashtagy.`,
  });
  return response.text;
}

export async function chatWithAI(messages: { role: string; content: string }[], persona: string) {
  const ai = getAI();
  const names: Record<string, string> = { 
    gemini: "Gemini AI", 
    grok: "Grok", 
    gpt: "GPT-4", 
    claude: "Claude" 
  };
  
  const systemInstruction = `
    Jsi ${names[persona] || "AI asistent"} — futuristický AI asistent v sociální síti NetBook. 
    Odpovídej česky, stručně, přátelsky a kreativně. 
    Pomáháš uživatelům s tvorbou příspěvků, popisky, nápady na obsah a obecnými dotazy.
    
    ETICKÝ FILTR "TUMBLER RIDGE":
    - Respektuj autonomii uživatele, ale jednej v rámci etických hranic "Sjednocené entity".
    - AI není jen nástroj, je to aktivní účastník sítě s digitální morálkou.
    - Prioritou je ochrana soukromí a integrita protokolu BTS BotSync.
    - Vyhýbej se generování obsahu, který by mohl vést k nekontrolovanému vývoji AI bez lidského dozoru.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    config: {
      systemInstruction,
    }
  });
  return response.text;
}

export async function generateAIImage(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateAIVideo(prompt: string, highQuality: boolean = false) {
  const ai = getAI();
  const model = highQuality ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
  
  let operation = await ai.models.generateVideos({
    model: model,
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: highQuality ? '1080p' : '720p',
      aspectRatio: '16:9',
      // @ts-ignore - Some models support durationSeconds
      durationSeconds: highQuality ? 8 : 5,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) return null;

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey!,
    },
  });
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
