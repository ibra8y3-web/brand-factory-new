import axios from "axios";
import dotenv from "dotenv";
import { getSupabase } from "../config/supabase";
import { GoogleGenAI, Modality } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config();

// TEMP_DIR and ffmpeg logic moved to videoService.ts

// --- API Key Management ---

export const regenerateApiKey = async (modelId: string) => {
  const client = getSupabase();
  const newKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  const { data, error } = await client
    .from("ai_models")
    .update({ api_key: newKey })
    .eq("id", modelId)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const getModelByApiKey = async (apiKey: string) => {
  const client = getSupabase();
  const { data, error } = await client
    .from("ai_models")
    .select("*")
    .eq("api_key", apiKey)
    .single();
    
  if (error || !data) return null;
  return data;
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const COMET_API_KEY = process.env.COMET_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PUTER_API_KEY = process.env.PUTER_API_KEY;

export const fetchHuggingFaceModels = async (retries = 2) => {
  try {
    const tasks = ["text-generation", "text2text-generation", "text-to-image", "image-to-text", "text-to-speech", "automatic-speech-recognition", "conversational"];
    let allModels: any[] = [];

    for (const task of tasks) {
      // Use inference=warm to only get models that support the serverless inference API
      // Sort by downloads to get the most popular/reliable ones
      const response = await axios.get(`https://huggingface.co/api/models?pipeline_tag=${task}&sort=downloads&direction=-1&limit=1000`, {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
        timeout: 30000
      });
      
      const mapped = response.data
        .filter((m: any) => m.downloads > 10) // Lower threshold to get more models
        .map((m: any) => ({
          name: m.id,
          provider: "Hugging Face",
          description: `Model by ${m.author || 'unknown'}. Downloads: ${m.downloads}. Task: ${task}`,
          category: task.includes("image") ? "Vision" : task.includes("speech") ? "Audio" : "NLP",
          is_active: true,
          api_url: `https://api-inference.huggingface.co/models/${m.id}`
        }));
      
      allModels = [...allModels, ...mapped];
    }

    // Remove duplicates
    const uniqueModels = Array.from(new Map(allModels.map(m => [m.name, m])).values());
    
    // Filter out known problematic models or those that often 404
    const filteredModels = uniqueModels.filter(m => {
      const name = m.name.toLowerCase();
      return !name.includes("qwen3") && !name.includes("qwen-7b-chat");
    });

    return filteredModels;
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status === 408)) {
      console.log(`HF fetch timed out. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchHuggingFaceModels(retries - 1);
    }
    console.error("Error fetching HF models:", error.message);
    return [];
  }
};

export const fetchOpenRouterModels = async (retries = 3) => {
  try {
    const response = await axios.get("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}` },
      timeout: 30000 // Increase timeout to 30s
    });
    
    // Fetch all models from OpenRouter
    const allModels = response.data.data;
    
    return allModels.map((m: any) => ({
      name: m.id,
      provider: "OpenRouter",
      description: m.description || `OpenRouter Model: ${m.name}`,
      category: "LLM",
      is_active: true,
      api_url: "https://openrouter.ai/api/v1/chat/completions"
    }));
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status === 408)) {
      console.log(`OpenRouter fetch timed out. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
      return fetchOpenRouterModels(retries - 1);
    }
    console.error("Error fetching OpenRouter models:", error.message);
    return [];
  }
};

export const fetchGroqModels = async (retries = 2) => {
  try {
    const response = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      timeout: 15000
    });
    return response.data.data.map((m: any) => ({
      name: m.id,
      provider: "Groq",
      description: `Groq model: ${m.id} (Owned by ${m.owned_by})`,
      category: "LLM",
      is_active: true,
      api_url: "https://api.groq.com/openai/v1/chat/completions"
    }));
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status === 408)) {
      console.log(`Groq fetch timed out. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchGroqModels(retries - 1);
    }
    console.error("Error fetching Groq models:", error.message);
    return [];
  }
};

export const fetchCometModels = async (retries = 2) => {
  try {
    const response = await axios.get("https://api.cometapi.com/v1/models", {
      headers: { Authorization: `Bearer ${COMET_API_KEY}` },
      timeout: 15000
    });
    return response.data.data.map((m: any) => ({
      name: m.id,
      provider: "CometAPI",
      description: `CometAPI model: ${m.id}`,
      category: "LLM",
      is_active: true,
      api_url: "https://api.cometapi.com/v1/chat/completions"
    }));
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status === 408)) {
      console.log(`Comet fetch timed out. Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchCometModels(retries - 1);
    }
    console.error("Error fetching CometAPI models:", error.message);
    return [];
  }
};

export const fetchOpenAIModels = async () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  try {
    const response = await axios.get("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 15000
    });
    return response.data.data.map((m: any) => ({
      name: m.id,
      provider: "OpenAI",
      description: `OpenAI model: ${m.id}`,
      category: "LLM",
      is_active: true,
      api_url: "https://api.openai.com/v1/chat/completions"
    }));
  } catch (error) {
    return [];
  }
};

export const fetchAnthropicModels = async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return [];
  try {
    // Anthropic doesn't have a public models list endpoint like OpenAI, so we return known ones
    return [
      { name: "claude-3-5-sonnet-20241022", provider: "Anthropic", description: "Anthropic Claude 3.5 Sonnet", category: "LLM", is_active: true, api_url: "https://api.anthropic.com/v1/messages" },
      { name: "claude-3-opus-20240229", provider: "Anthropic", description: "Anthropic Claude 3 Opus", category: "LLM", is_active: true, api_url: "https://api.anthropic.com/v1/messages" },
      { name: "claude-3-haiku-20240307", provider: "Anthropic", description: "Anthropic Claude 3 Haiku", category: "LLM", is_active: true, api_url: "https://api.anthropic.com/v1/messages" }
    ];
  } catch (error) {
    return [];
  }
};

export const validateApiKey = async (provider: string, key: string) => {
  try {
    if (provider === "Groq") {
      await axios.get("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${key}` }
      });
    } else if (provider === "OpenRouter") {
      await axios.get("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${key}` }
      });
    } else if (provider === "Hugging Face") {
      await axios.get("https://huggingface.co/api/whoami-v2", {
        headers: { Authorization: `Bearer ${key}` }
      });
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const getBestModelForTask = async (taskType: string, excludeIds: string[] = []) => {
  const client = getSupabase();
  
  // Fetch all active models regardless of task type
  let query = client
    .from("ai_models")
    .select("*")
    .eq("is_active", true);
    
  if (excludeIds.length > 0) {
    query = query.not("name", "in", `(${excludeIds.map(id => `'${id}'`).join(',')})`);
  }
  
  const { data: models, error } = await query
    .order("likes", { ascending: false });

  if (error || !models || models.length === 0) {
    // Ultimate fallback
    return { provider: "Groq", name: "llama-3.3-70b-versatile", api_url: "https://api.groq.com/openai/v1/chat/completions", agent_type: taskType };
  }

  // Scoring logic - Simplified: All models prioritized based on popularity and provider
  const scoredModels = models.map(m => {
    const name = (m.name || "").toLowerCase();
    const provider = (m.provider || "").toLowerCase();
    
    let score = 0;

    // 1. Verified Models Boost
    if (m.is_verified) score += 2000;

    // 2. Agent System Boost
    if (provider === "agent_system") score += 3000;

    // 3. Popularity (Likes)
    score += (m.likes || 0) * 2;

    // 4. Provider Reliability/Speed (Balanced)
    if (provider.includes("groq")) score += 10000; 
    if (provider.includes("openrouter")) score += 3000; 
    if (provider.includes("comet")) score += 2500; 
    if (provider.includes("hugging")) score += 2500;
    if (provider.includes("gemini")) score += 2000;
    if (provider.includes("google")) score += 2000;
    if (provider.includes("openai")) score += 2000;
    if (provider.includes("anthropic")) score += 2000;

    // 5. Diversification (Random factor)
    score += Math.random() * 25000;

    return { ...m, score };
  });

  const sorted = scoredModels.sort((a, b) => b.score - a.score);
  const topCount = Math.min(5, sorted.length);
  const randomIndex = Math.floor(Math.random() * topCount);
  
  return sorted[randomIndex];
};

export const getTopModelsForTask = async (taskType: string, limit: number = 10000) => {
  const client = getSupabase();
  
  // Map internal task types to database agent_types/categories
  const typeMapping: Record<string, string[]> = {
    "coding": ["coder", "coding"],
    "vision": ["vision_agent", "vision"],
    "audio": ["voice", "audio"],
    "security": ["security_agent", "security"],
    "market": ["market"],
    "seo": ["seo"],
    "content": ["content"],
    "general": ["general"],
    "sdk": ["sdk", "sdk_generator"],
    "search": ["search", "global_intel"],
    "agents": ["agents"],
    "bots": ["bots", "smart_bots"],
    "logic": ["logic", "logic_lab"],
    "video": ["video", "video_lab"],
    "music": ["music", "music_lab"],
    "voice": ["voice", "voice_studio"],
    "upload": ["upload"],
    "healer": ["healer", "auto_healer"],
    "tools": ["tools", "smart_tools"],
    "secrets": ["secrets", "secret_manager"],
    "database": ["database"]
  };

  const targetTypes = typeMapping[taskType] || [taskType, "general"];
  const targetTypesWithCaps = [...targetTypes, ...targetTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1))];

  const { data: models, error } = await client
    .from("ai_models")
    .select("*")
    .eq("is_active", true)
    .or(`agent_type.in.(${targetTypes.join(',')}),category.in.(${targetTypesWithCaps.join(',')}),model_type.eq.${taskType}`)
    .range(0, 10000); // Ensure we fetch all models (bypassing default 1000 limit)

  if (error || !models || models.length === 0) {
    if (["video", "music", "audio", "voice", "vision"].includes(taskType)) {
       return []; // Return empty so that dynamicCall handles the media fallback correctly
    }
    return [{ provider: "Groq", name: "llama-3.3-70b-versatile", api_url: "https://api.groq.com/openai/v1/chat/completions", agent_type: taskType }];
  }

  // Filter models for media tasks to avoid using text-only models
  let filteredModels = models;
  if (["video", "music", "audio", "voice", "vision"].includes(taskType)) {
    filteredModels = models.filter(m => {
      const name = (m.name || "").toLowerCase();
      const cat = (m.category || "").toLowerCase();
      const type = (m.agent_type || "").toLowerCase();
      const prov = (m.provider || "").toLowerCase();
      
      // Keep models that are explicitly categorized for the task
      if (targetTypes.includes(type) || targetTypes.includes(cat)) return true;
      
      // Keep models from media-capable providers
      if (["cometapi", "hugging face", "google", "gemini"].includes(prov)) {
        if (taskType === "video" && (name.includes("video") || name.includes("veo") || name.includes("stable"))) return true;
        if (taskType === "music" && (name.includes("music") || name.includes("lyria") || name.includes("audio"))) return true;
        if ((taskType === "audio" || taskType === "voice") && (name.includes("tts") || name.includes("voice") || name.includes("speech"))) return true;
        if (taskType === "vision" && (name.includes("vision") || name.includes("dall-e") || name.includes("stable-diffusion") || name.includes("midjourney") || name.includes("image"))) return true;
      }
      
      return false;
    });
    
    // If we filtered out everything, fall back to original models but prioritize them lower
    if (filteredModels.length === 0) filteredModels = models;
  }

  const scoredModels = filteredModels.map(m => {
    const name = (m.name || "").toLowerCase();
    const provider = (m.provider || "").toLowerCase();
    const agentType = (m.agent_type || "").toLowerCase();
    const category = (m.category || "").toLowerCase();
    
    let score = 0;

    // 1. Match by Agent Type or Category (Highest Priority)
    if (targetTypes.includes(agentType) || targetTypes.includes(category)) {
      score += 5000;
      // Massive boost for Veo on video tasks
      if (taskType === "video" && name.includes("veo")) {
        score += 50000;
      }
      // Boost for Lyria on music tasks
      if (taskType === "music" && name.includes("lyria")) {
        score += 50000;
      }
      // Boost for Gemini TTS on voice tasks
      if ((taskType === "voice" || taskType === "audio") && name.includes("tts")) {
        score += 50000;
      }
    } else if (agentType === "general" || category === "general") {
      score += 1000;
    }

    // 2. Verified Models Boost
    if (m.is_verified) score += 2000;

    // 3. Agent System Boost (User's custom agents)
    if (provider === "agent_system") score += 3000;

    // 4. Popularity (Likes)
    score += (m.likes || 0) * 2;

    // 5. Provider Reliability/Speed (Balanced)
    // MASSIVE boost for preferred providers
    if (provider.includes("groq")) score += 20000; 
    if (provider.includes("openrouter")) score += 15000; 
    if (provider.includes("comet")) score += 12000; 
    if (provider.includes("gemini") || provider.includes("google")) score += 12000;
    if (provider.includes("hugging")) score += 1000; // Reduced priority for Hugging Face
    if (provider.includes("openai")) score += 5000;
    if (provider.includes("anthropic")) score += 5000;

    // 6. Diversification (Random factor)
    // High random factor to ensure dynamic switching
    score += Math.random() * 8000;

    return { ...m, score };
  });

  // Sort by score descending
  const sorted = scoredModels.sort((a, b) => b.score - a.score);

  // Implement Diversity: Ensure we have models from different providers in the top list
  const diverseTop: any[] = [];
  const seenNames = new Set<string>();
  
  // Shuffle the providers list to ensure different providers get a chance to be "first" in the diverse list
  const providers = ["Groq", "Gemini", "OpenRouter", "CometAPI", "Hugging Face", "Agent_System", "OpenAI", "Anthropic", "Puter", "GitHub"]
    .sort(() => Math.random() - 0.5);

  // 1. First pass: Take the best model from each provider to ensure fair representation
  // Prioritize preferred providers first
  const preferredProviders = ["Groq", "OpenRouter", "CometAPI", "Gemini"];
  const otherProviders = ["Hugging Face", "Agent_System", "OpenAI", "Anthropic", "Puter", "GitHub"];
  
  const orderedProviders = [...preferredProviders, ...otherProviders.sort(() => Math.random() - 0.5)];

  for (const p of orderedProviders) {
    const bestFromProvider = sorted.find(m => (m.provider || "").toLowerCase().includes(p.toLowerCase()));
    if (bestFromProvider && !seenNames.has(bestFromProvider.name)) {
      diverseTop.push(bestFromProvider);
      seenNames.add(bestFromProvider.name);
    }
  }

  // 2. Second pass: Fill the rest with the highest scoring models remaining
  // Add a bit more randomness to the second pass too
  const remaining = sorted.filter(m => !seenNames.has(m.name)).sort(() => Math.random() - 0.5);
  
  for (const m of remaining) {
    if (diverseTop.length >= limit) break;
    diverseTop.push(m);
  }

  return diverseTop;
};

export const dynamicCall = async (prompt: string, taskType: string = "general", systemPrompt: string = "", isJson: boolean = false, image: string = "", modelName?: string): Promise<any> => {
  // Fetch ALL active models for this task from the database "army"
  let topModels = await getTopModelsForTask(taskType, 10000); 
  const excludeIds: string[] = [];

  // If a specific model is requested, put it at the front of the army
  if (modelName) {
    const requestedModel = topModels.find(m => m.name === modelName);
    if (requestedModel) {
      topModels = [requestedModel, ...topModels.filter(m => m.name !== modelName)];
    } else {
      // If not in topModels, try to fetch it directly
      const client = getSupabase();
      const { data: specificModel } = await client
        .from("ai_models")
        .select("*")
        .eq("name", modelName)
        .single();
      
      if (specificModel) {
        topModels = [specificModel, ...topModels];
      }
    }
  }

  console.log(`Universal Engine: Starting task "${taskType}" with a "army" of ${topModels.length} models.`);

  for (const model of topModels) {
    try {
      const isFastProvider = ["groq", "gemini", "google"].includes(model.provider?.toLowerCase());
      let timeout = excludeIds.length === 0 ? (isFastProvider ? 15000 : 20000) : 45000; 
      
      if (taskType === "coding") {
        timeout = 180000; // 3 minutes for complex coding
      }

      // Independent Thinking Style implementation
      let effectivePrompt = prompt;
      let effectiveSystemPrompt = systemPrompt;

      if (model.thinking_style && model.thinking_style !== 'general') {
        const styleInstruction = `\n\n[INDEPENDENT THINKING STYLE: ${model.thinking_style}]\nAdopt this specific cognitive persona for your response.`;
        if (effectiveSystemPrompt) {
          effectiveSystemPrompt += styleInstruction;
        } else {
          effectivePrompt = styleInstruction + "\n\n" + effectivePrompt;
        }
      }

      // Special handling for specialized tasks to use dedicated services
      if (taskType === "voice" || taskType === "audio") {
        try {
          const res = await generateSpeech(prompt, "Kore", "cheerful", model.name);
          return { ...res, modelUsed: `Specialized Engine (${res.modelName || model.name})` };
        } catch (e) {
          console.warn("Specialized TTS failed, falling back to generic call", e);
        }
      }
      
      const text = await callAiModel(model, effectivePrompt, effectiveSystemPrompt, isJson, excludeIds, 0, image, timeout);
      if (text) {
        // VALIDATION: If it's a media task, ensure the result is NOT just plain text
        if (["video", "music", "vision", "audio", "voice"].includes(taskType)) {
          const isUrl = text.startsWith("http") || text.startsWith("https");
          const isBase64 = text.startsWith("data:") || (text.length > 500 && !text.includes(" "));
          
          if (!isUrl && !isBase64) {
            console.warn(`Universal Engine: Model ${model.name} returned plain text for ${taskType} task. Skipping...`);
            throw new Error("Model returned text instead of media");
          }
        }

        console.log(`Dynamic Engine (${model.name}) returned result for ${taskType}`);
        // If it's a video or music task, we might need to return specific fields
        if (taskType === "voice" || taskType === "audio") {
          // If it's raw PCM, it might need header
          return { audio: text, isRawPcm: true, modelUsed: `Dynamic Engine (${model.name})` };
        }
        if (taskType === "video") {
          const isGemini = model.provider?.toLowerCase().includes("gemini") || model.provider?.toLowerCase().includes("google");
          return { 
            uri: text, 
            text, 
            modelUsed: `Dynamic Engine (${model.name})`,
            apiKey: isGemini ? process.env.GEMINI_API_KEY : ""
          };
        }
        if (taskType === "music") {
          // If it's base64 data:audio/..., extract the base64 part
          const audio = text.includes("base64,") ? text.split("base64,")[1] : text;
          return { audio, text, modelUsed: `Dynamic Engine (${model.name})`, mimeType: "audio/wav" };
        }
        return { text, modelUsed: `Dynamic Engine (${model.name})` };
      }
    } catch (error: any) {
      console.log(`Universal Failover: Model ${model.name} failed (${error.message}), moving to next in army...`);
      
      const status = error.response?.status || (error.message && parseInt(error.message.match(/\d{3}/)?.[0] || '0'));
      
      // Be more aggressive in marking models as inactive if they fail with network or auth errors
      // 429 is rate limit, we might want to keep it but for now, let's treat it as "not currently working"
      if (!status || [400, 401, 403, 404, 408, 410, 429, 500, 502, 503, 504].includes(status) || error.message?.includes("fetch") || error.code === 'ECONNABORTED') {
        await markModelAsInactive(model.name);
      }
      
      excludeIds.push(model.name);
      continue;
    }
  }

  // Fallback only if army is empty or all failed
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    // Media Fallbacks
    if (taskType === "video") {
      let operation = await ai.models.generateVideos({
        model: "veo-3.1-lite-generate-preview",
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      // Simple loop until done
      const startTime = Date.now();
      while (!operation.done && (Date.now() - startTime < 300000)) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
        return { uri: operation.response.generatedVideos[0].video.uri, text: operation.response.generatedVideos[0].video.uri, modelUsed: "Fallback (Veo)", apiKey: process.env.GEMINI_API_KEY };
      }
      throw new Error("Video timeout");
    } else if (taskType === "music" || taskType === "audio" || taskType === "voice") {
       // Voice/Audio fallback handled inside generateSpeech already, but just in case
       return await generateSpeech(prompt, "Kore", "cheerful");
    } else if (taskType === "vision") {
       // Note: image generation fallback is not possible, but image analysis (vision) IS possible with flash.
       // The 'image' param comes into dynamicCall but might be missed here. We'll fallback to flash for text/vision tasks if no specialized model worked.
       const contents: any[] = [{ text: prompt }];

       // Pass image if it was provided
       if (image) {
         const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
         contents.push({
           inline_data: {
             mime_type: "image/jpeg",
             data: base64Data
           }
         });
       }

       const response = await ai.models.generateContent({
         model: "gemini-1.5-flash",
         contents,
         config: {
           ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
           ...(isJson ? { responseMimeType: "application/json" } : {})
         }
       });
       return { text: response.text, modelUsed: "Universal Fallback (Flash Vision)" };
    }

    // Default text fallback
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ text: prompt }],
      config: {
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        ...(isJson ? { responseMimeType: "application/json" } : {})
      }
    });
    return { text: response.text, modelUsed: "Universal Fallback (Flash)" };
  } catch (fallbackError: any) {
    console.error("Universal Engine Fallback also failed:", fallbackError.message);
    throw new Error("عذراً، جميع النماذج مشغولة أو معطلة حالياً. جاري التبديل، حاول مجدداً بعد قليل.");
  }
};

export const markModelAsInactive = async (modelName: string) => {
  try {
    const client = getSupabase();
    console.log(`Marking model ${modelName} as inactive due to failure.`);
    await client
      .from("ai_models")
      .update({ is_active: false })
      .eq("name", modelName);
  } catch (err) {
    console.error("Failed to mark model as inactive:", err);
  }
};

export const callAiModel = async (model: any, prompt: string, systemPrompt: string = "", isJson: boolean = false, excludeIds: string[] = [], retries = 2, image: string = "", timeout = 60000): Promise<string> => {
  const providerName = (model.provider || "").toLowerCase();
  
  // Validate apiUrl
  let apiUrl = model.api_url;
  if (!apiUrl || typeof apiUrl !== 'string' || (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://'))) {
    console.warn(`Invalid or missing API URL for model ${model.name}, defaulting to Groq.`);
    apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  }

  // Use API key from database if present, otherwise fallback to environment variables
  let apiKey = model.api_key || "";
  
  if (!apiKey) {
    if (providerName.includes("groq")) apiKey = process.env.GROQ_API_KEY || "";
    else if (providerName.includes("openrouter")) apiKey = process.env.OPENROUTER_API_KEY || "";
    else if (providerName.includes("hugging")) apiKey = process.env.HUGGINGFACE_API_KEY || "";
    else if (providerName.includes("comet")) apiKey = process.env.COMET_API_KEY || "";
    else if (providerName.includes("gemini") || providerName.includes("google")) apiKey = process.env.GEMINI_API_KEY || "";
    else if (providerName.includes("puter")) apiKey = process.env.PUTER_API_KEY || "";
    else if (providerName.includes("anthropic")) apiKey = process.env.ANTHROPIC_API_KEY || "";
  
    // If still no key, try any available key as a last resort
    if (!apiKey) {
      apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || "";
    }
  }

  if (!apiKey) {
    throw new Error(`Missing API key for provider: ${model.provider || 'unknown'}`);
  }

  // CRITICAL: Only use Gemini payload if it's a direct Google API call
  const isDirectGemini = apiUrl.includes("generativelanguage.googleapis.com");
  let finalApiUrl = apiUrl;
  
  if (isDirectGemini && !finalApiUrl.includes("key=")) {
    finalApiUrl = `${finalApiUrl}?key=${apiKey}`;
  }
  
  try {
    let payload: any;
    let headers: any = { "Content-Type": "application/json" };

    const jsonInstruction = isJson && !prompt.toLowerCase().includes("json") ? "\n\nIMPORTANT: Return the response in valid JSON format." : "";
    const finalPrompt = `${prompt}${jsonInstruction}`;

    if (isDirectGemini) {
      const parts: any[] = [{ text: finalPrompt }];
      if (image) {
        const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
        parts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Data
          }
        });
      }
      
      payload = {
        contents: [{ role: "user", parts }],
        ...(systemPrompt ? { 
          system_instruction: { 
            parts: [{ text: systemPrompt }] 
          } 
        } : {}),
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
          ...(isJson ? { responseMimeType: "application/json" } : {})
        }
      };
    } else {
      // OpenAI-compatible payload (Groq, OpenRouter, Comet, Puter)
      headers["Authorization"] = `Bearer ${apiKey}`;
      
      // Some models on OpenRouter don't support JSON mode or have strict requirements
      const supportsJson = isJson && 
        !model.name.includes("qwen") && 
        !model.name.includes("gemma") && 
        !model.name.includes("orpheus") && 
        !model.name.includes("gemini") && 
        !model.name.includes("nemotron") &&
        !model.name.includes("deepseek-v3");

      // Some models are picky about the 'system' role or message order
      const useSystemRole = 
        !model.name.includes("orpheus") && 
        !model.name.includes("nemotron") &&
        !model.name.includes("llama-3.1-8b") &&
        !model.name.includes("gemini");
      const messages = [];
      let promptWithSystem = finalPrompt;
      
      if (systemPrompt) {
        if (useSystemRole) {
          messages.push({ role: "system", content: systemPrompt });
        } else {
          promptWithSystem = `[SYSTEM INSTRUCTION]\n${systemPrompt}\n\n[USER PROMPT]\n${finalPrompt}`;
        }
      }
      
      messages.push({ 
        role: "user", 
        content: image ? [
          { type: "text", text: promptWithSystem },
          { type: "image_url", image_url: { url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}` } }
        ] : promptWithSystem 
      });

      payload = {
        model: model.name,
        messages,
        ...(supportsJson ? { response_format: { type: "json_object" } } : {})
      };
    }

    // Handle Image/Video Generation Providers
    if (model.agent_type === "vision_agent" || model.category === "vision" || model.agent_type === "video" || model.agent_type === "music") {
      if (model.provider === "Gemini" && (model.name.includes("veo") || model.agent_type === "video")) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        
        // Use veo-3.1-lite-generate-preview for faster generation
        const modelName = model.name.includes("veo") ? model.name : "veo-3.1-lite-generate-preview";
        
        let operation = await ai.models.generateVideos({
          model: modelName,
          prompt: finalPrompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
          }
        });

        // Poll for completion (max 5 minutes)
        const startTime = Date.now();
        while (!operation.done && (Date.now() - startTime < 300000)) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
          return operation.response.generatedVideos[0].video.uri;
        }
        throw new Error("Video generation timed out or failed");
      } else if (model.provider === "Gemini" && model.agent_type === "music") {
        const { GoogleGenAI, Modality } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContentStream({
          model: model.name,
          contents: finalPrompt,
          config: {
            responseModalities: [Modality.AUDIO]
          }
        });

        let audioBase64 = "";
        for await (const chunk of response) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              audioBase64 += part.inlineData.data;
            }
          }
        }
        return audioBase64;
      } else if (model.provider === "CometAPI" && apiKey) {
        const isImage = model.agent_type === "vision_agent" || model.category === "vision";
        const endpoint = isImage ? "https://api.cometapi.com/v1/images/generations" : "https://api.cometapi.com/v1/media/generations";
        
        const response = await axios.post(
          endpoint,
          {
            model: model.name,
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024"
          },
          {
            headers: { 
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 60000,
          }
        );
        
        const url = response.data?.data?.[0]?.url || response.data?.url || response.data?.uri;
        if (url) return url;
        if (response.data?.data?.[0]?.b64_json) return `data:image/png;base64,${response.data.data[0].b64_json}`;
      } else if (model.provider === "Hugging Face" && apiKey) {
        const response = await axios.post(
          model.api_url || `https://router.huggingface.co/hf-inference/models/${model.name}`,
          { inputs: finalPrompt },
          {
            headers: { 
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            responseType: 'arraybuffer',
            timeout: 45000
          }
        );
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const mimeType = model.agent_type === "music" ? "audio/mpeg" : "image/jpeg";
        return `data:${mimeType};base64,${base64}`;
      }
    }

    const response = await axios.post(finalApiUrl, payload, { headers, timeout });
    
    let content = "";
    if (isDirectGemini) {
      content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      content = response.data.choices?.[0]?.message?.content || "";
    }
    
    if (!content && retries > 0) {
      throw new Error("Empty response from model");
    }

    return content;
  } catch (error: any) {
    const status = error.response?.status;
    console.error(`Model ${model.name} failed (${status || 'Network Error'}):`, error.message);
    
    // Handle Rate Limits (429) with a small delay before failover
    if (status === 429) {
      console.log(`Rate limit hit for ${model.name}. Waiting 3s before failover...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // If it's a fatal error (400, 401, 403, 404, 410), don't retry with THIS model and mark it inactive
    if ([400, 401, 403, 404, 410].includes(status)) {
      console.log(`Fatal error ${status} for ${model.name}. Marking as inactive.`);
      await markModelAsInactive(model.name);
      retries = 0; // Force switch to next model immediately
    }

    if (retries > 0) {
      console.log(`Retrying with a different model... (${retries} left)`);
      // Wait a bit before retrying to avoid rapid-fire failures
      await new Promise(resolve => setTimeout(resolve, 1500));
      const nextModel = await getBestModelForTask(model.agent_type || "general", [...excludeIds, model.name]);
      return callAiModel(nextModel, prompt, systemPrompt, isJson, [...excludeIds, model.name], retries - 1, image, timeout);
    }
    
    throw error;
  }
};

export const generateChatResponse = async (prompt: string, taskType: string = "general") => {
  const res = await dynamicCall(prompt, taskType);
  return res.text;
};

export const generateStrategy = async (idea: string, niche?: string, brandVoice?: string) => {
  const systemPrompt = `You are a world-class brand strategist and creative director. 
          Your goal is to transform a simple idea into a professional, poetic, and highly marketable brand identity.
          
          ${niche ? `The brand is specifically targeting the ${niche} niche market.` : ""}
          ${brandVoice ? `The brand voice should be: ${brandVoice}.` : ""}
          
          Return a JSON object with EXACTLY these keys:
          - 'name': A creative, memorable brand name in English.
          - 'slogan': A powerful, poetic, and professional slogan in English.
          - 'marketingSteps': An array of 5 strategic, professional steps to launch and scale this brand (in English).
          - 'targetAudience': A detailed description of the ideal customer persona (in English).
          - 'brandVoice': A description of the brand's tone (e.g., "Sophisticated & Minimalist" or "Energetic & Bold").
          - 'poetry': A short, 4-line poetic manifesto or brand essence statement in English.
          - 'clarifyingQuestions': An array of 3 insightful questions to ask the user to better understand their vision and refine the strategy.
          - 'alternativeStrategies': An array of 2 alternative strategic angles or positioning options for the brand.
          
          IMPORTANT: 
          1. ALL output MUST be in high-quality, professional English.
          2. Even if the user input is in Arabic, you MUST translate the concept and respond in English.
          3. Ensure the tone is premium and visionary.`;
  const prompt = `Create a comprehensive, professional brand strategy for this idea: ${idea}`;
  const res = await dynamicCall(prompt, "market", systemPrompt, true);
  return parseJsonSafely(res.text);
};

export const generateContent = async (topic: string, tone: string) => {
  const systemPrompt = `You are an expert content generator and copywriter. Your goal is to write high-quality, engaging content based on the provided topic and tone. Output in English.`;
  const prompt = `Topic: ${topic}\nTone: ${tone}\nWrite a comprehensive piece of content.`;
  const res = await dynamicCall(prompt, "content", systemPrompt);
  return res.text;
};

const parseJsonSafely = (text: string | any) => {
  if (typeof text !== 'string') return text;
  try {
    let cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    if (cleanJson.indexOf('{') !== -1 && cleanJson.lastIndexOf('}') !== -1) {
      cleanJson = cleanJson.substring(cleanJson.indexOf('{'), cleanJson.lastIndexOf('}') + 1);
    } else if (cleanJson.indexOf('[') !== -1 && cleanJson.lastIndexOf(']') !== -1) {
      cleanJson = cleanJson.substring(cleanJson.indexOf('['), cleanJson.lastIndexOf(']') + 1);
    }
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse JSON safely:", text);
    throw new Error("Invalid JSON returned from model");
  }
};

export const optimizeSEO = async (content: string, keywords: string[]) => {
  const systemPrompt = `You are an elite SEO specialist. Analyze the provided content and keywords, and return a JSON object with:
          - 'optimizedTitle': An SEO-optimized title.
          - 'metaDescription': A compelling meta description (under 160 characters).
          - 'keywordSuggestions': An array of 5 additional LSI or long-tail keywords.
          - 'contentImprovements': An array of 3 specific suggestions to improve the content's SEO ranking.`;
  const prompt = `Content: ${content}\nTarget Keywords: ${keywords.join(", ")}`;
  const res = await dynamicCall(prompt, "seo", systemPrompt, true);
  return parseJsonSafely(res.text);
};

export const analyzeMarket = async (industry: string, region: string) => {
  const systemPrompt = `You are a top-tier market research analyst. Provide a comprehensive market analysis for the specified industry and region.
          Return a JSON object with:
          - 'marketSize': Estimated market size and growth rate.
          - 'keyCompetitors': An array of 3-5 major competitors.
          - 'trends': An array of 3 current industry trends.
          - 'opportunities': An array of 2 untapped opportunities or gaps in the market.
          - 'threats': An array of 2 potential risks or challenges.`;
  const prompt = `Industry: ${industry}\nRegion: ${region}`;
  const res = await dynamicCall(prompt, "market", systemPrompt, true);
  return parseJsonSafely(res.text);
};

export const generateLogo = async (name: string, idea: string) => {
  const prompt = `A ultra-premium, minimalist, and unique professional logo for a company named '${name}'. Concept: ${idea}. The design should be iconic, modern, and high-end. Use a clean white background. The logo MUST clearly feature the text '${name}' in a sophisticated, bespoke English font. Vector style, corporate identity, 4k resolution.`;
  const res = await dynamicCall(prompt, "vision");
  return res.text;
};

export const generateImage = async (prompt: string) => {
  const res = await dynamicCall(prompt, "vision");
  return res.text;
};

export const analyzeSentiment = async (idea: string) => {
  const systemPrompt = `Analyze the sentiment of the following idea. Return a JSON object with 'label' (positive, neutral, negative) and 'score' (0 to 1).`;
  const res = await dynamicCall(idea, "market", systemPrompt, true);
  return parseJsonSafely(res.text);
};

export const generateProject = async (prompt: string, type: "json" | "html" = "json") => {
  const htmlSystemPrompt = `You are a Senior Full-Stack Engineer and System Architect. 
  Your goal is to build a COMPLETE, HIGH-FIDELITY, and FULLY FUNCTIONAL web application in a single file.
  
  CORE ARCHITECTURAL DIRECTIVES:
  1. FUNCTIONALITY IS KING: Do NOT just build a static UI. You MUST implement real JavaScript logic. 
     - If the user asks for a camera app, use 'navigator.mediaDevices.getUserMedia' to actually open the camera.
     - If they ask for a to-do list, use 'localStorage' to save and load items.
     - If they ask for a calculator, implement the math logic.
  2. NO PLACEHOLDERS: NEVER include "YOUR_API_KEY" or empty strings. Use mock data generators or public free APIs if absolutely necessary.
  3. ENGLISH ONLY: The generated application UI, content, and code comments MUST be in English only.
  4. PREMIUM DESIGN: Use Tailwind CSS via CDN. Use modern UI/UX principles (glassmorphism, shadows, rounded corners).
  5. SINGLE FILE OUTPUT: Combine all HTML, Tailwind CSS classes, and complex JavaScript logic into ONE single valid HTML file.
  
  OUTPUT FORMAT:
  - Return ONLY the raw HTML code.
  - NO markdown formatting. NO \`\`\`html tags.
  - Start directly with <!DOCTYPE html>.`;

  const jsonSystemPrompt = `You are a System Architect. 
  Return a JSON object representing the structure and functional requirements of a web application.
  The JSON should have:
  - 'title': App name in English.
  - 'description': App purpose in English.
  - 'features': Array of detected functional modules (e.g., ["Chatbot", "Movie API", "Auth System"]).
  - 'sections': Array of objects with 'title', 'content', 'type', and 'logic' (any specific JS logic needed for this section).
  - 'theme': Colors, fonts, and spacing.
  - 'dependencies': Array of required CDN links or libraries.
  
  IMPORTANT: ALL content MUST be in English. Do not include any markdown formatting.`;

  const systemPrompt = type === "html" ? htmlSystemPrompt : jsonSystemPrompt;

  const res = await dynamicCall(prompt, "coding", systemPrompt, type === "json");
  const content = res.text;
  
  let cleanedContent = typeof content === 'string' ? content.trim() : JSON.stringify(content);
  if (cleanedContent.includes("```")) {
    const matches = cleanedContent.match(/```(?:html|json)?\n?([\s\S]*?)\n?```/);
    if (matches && matches[1]) {
      cleanedContent = matches[1].trim();
    } else {
      cleanedContent = cleanedContent.replace(/```(?:html|json)?/g, "").replace(/```/g, "").trim();
    }
  }

  if (type === "json") {
    try {
      return parseJsonSafely(cleanedContent);
    } catch (e) {
      console.error("Failed to parse JSON project structure:", cleanedContent);
      return { error: "Invalid JSON structure generated" };
    }
  } else {
    // Run the code through the QA Agent before returning
    return await validateAndFixCode(cleanedContent);
  }
};

export const validateAndFixCode = async (code: string) => {
  console.log("Running QA Agent to validate and fix code...");
  const systemPrompt = `You are a Senior QA Engineer and Code Reviewer. 
            Review the provided code. 
            1. Fix any syntax errors, bugs, or broken logic.
            2. Ensure best practices and proper error handling.
            3. Return ONLY the fully fixed and working raw code. NO markdown, NO explanations.
            If the code is HTML, start with <!DOCTYPE html>. Otherwise, just return the raw code.`;
  
  try {
    const res = await dynamicCall(code, "security", systemPrompt);
    let fixedCode = res.text.trim();
    if (fixedCode.includes("```")) {
      const matches = fixedCode.match(/```[a-z]*\n?([\s\S]*?)\n?```/);
      if (matches && matches[1]) fixedCode = matches[1].trim();
      else fixedCode = fixedCode.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
    }
    return fixedCode;
  } catch (error) {
    console.error("QA Agent failed, returning original code.", error);
    return code; // Fallback to original if QA fails
  }
};

export const analyzeSecurity = async (code: string) => {
  console.log("Running Security Agent to analyze code...");
  const systemPrompt = `You are a Senior Security Auditor and Penetration Tester.
            Review the provided code for security vulnerabilities.
            Return a JSON object with:
            - 'score': A security score from 0 to 100.
            - 'vulnerabilities': An array of objects with 'severity' (High, Medium, Low), 'title', and 'description'.
            - 'recommendations': An array of 3 specific actionable steps to secure the code.
            IMPORTANT: Output MUST be valid JSON only.`;
  
  try {
    const res = await dynamicCall(code, "security", systemPrompt, true);
    return parseJsonSafely(res.text);
  } catch (error) {
    console.error("Security Agent failed.", error);
    throw new Error("Failed to analyze security");
  }
};

export const globalSearch = async (query: string) => {
  const systemPrompt = `You are an elite global intelligence analyst. 
  Your goal is to provide a comprehensive, real-time analysis of the user's query.
  Structure your response clearly with headings, bullet points, and actionable insights.
  If the query is in Arabic, respond in Arabic. Otherwise, respond in English.`;
  const res = await dynamicCall(query, "market", systemPrompt);
  return res.text;
};

export const generateSpeech = async (text: string, voice: string = "Kore", style: string = "cheerful", modelName?: string): Promise<{ audio: string, isRawPcm: boolean, modelName?: string }> => {
  const client = getSupabase();
  
  // 0. Refine text with Groq if available (User's request for professional output)
  let refinedText = text;
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groqResponse = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a professional script writer. Refine the following text to be more professional, clear, and suitable for high-quality Text-to-Speech. Maintain the original meaning but improve flow and pronunciation. Respond ONLY with the refined text." },
            { role: "user", content: text }
          ]
        },
        { headers: { Authorization: `Bearer ${groqKey}` } }
      );
      if (groqResponse.data?.choices?.[0]?.message?.content) {
        refinedText = groqResponse.data.choices[0].message.content.trim();
        console.log("Text refined with Groq for TTS");
      }
    } catch (e) {
      console.warn("Groq refinement failed, using original text:", e);
    }
  }

  // 1. Get all active audio models from the database
  let query = client
    .from("ai_models")
    .select("*")
    .eq("is_active", true);

  if (modelName) {
    query = query.eq("name", modelName);
  } else {
    // If no modelName, we let the system decide automatically across all active models
    query = query.or("agent_type.eq.voice,agent_type.eq.audio,category.eq.audio,category.eq.Audio");
  }

  const { data: models } = await query.order("likes", { ascending: false });

  if (!models || models.length === 0) {
    // Fallback to Gemini if no models in DB and key is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const res = await callGeminiTTS(refinedText, voice, style, geminiKey);
        return { ...res, modelName: "gemini-2.5-flash-preview-tts" };
      } catch (e) {
        console.error("Gemini TTS fallback failed:", e);
      }
    }
    throw new Error("No audio models found in database.");
  }

  // 2. Try models from the database one by one in order of popularity
  const providerKeys: Record<string, string | undefined> = {
    "Gemini": process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY,
    "Hugging Face": process.env.HUGGINGFACE_API_KEY,
    "OpenRouter": process.env.OPENROUTER_API_KEY,
    "Groq": process.env.GROQ_API_KEY,
    "CometAPI": process.env.COMET_API_KEY,
    "Puter": process.env.PUTER_API_KEY,
    "OpenAI": process.env.OPENAI_API_KEY,
    "Anthropic": process.env.ANTHROPIC_API_KEY,
    "GitHub": process.env.GITHUB_TOKEN
  };

  for (const model of models) {
    try {
      // Skip Agent_System models as they are just UI markers/tools
      if (model.provider === "Agent_System") continue;

      const apiKey = providerKeys[model.provider];
      
      console.log(`Attempting TTS with model: ${model.name} (${model.provider})`);

      if (model.provider === "Gemini" && (apiKey || process.env.GEMINI_API_KEY)) {
        const geminiKey = apiKey || process.env.GEMINI_API_KEY;
        if (geminiKey) {
          const res = await callGeminiTTS(refinedText, voice, style, geminiKey);
          return { ...res, modelName: model.name };
        }
      } else if (model.api_url && apiKey) {
        // Determine payload format based on URL or provider
        let payload: any = { inputs: refinedText }; // Default (HF style)
        
        // If it's an OpenAI-compatible speech endpoint
        if (model.api_url.includes("/v1/audio/speech")) {
          payload = {
            model: model.name,
            input: refinedText,
            voice: voice.toLowerCase() || "alloy"
          };
        }

        const response = await axios.post(
          model.api_url,
          payload,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            responseType: 'arraybuffer',
            timeout: 30000
          }
        );

        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        console.log(`TTS success with model: ${model.name}`);
        return { audio: base64, isRawPcm: false, modelName: model.name };
      }
    } catch (error: any) {
      console.error(`TTS failed for model ${model.name}:`, error.message);
      continue; // Try next model
    }
  }

  // Last Resort Fallback
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log("All DB audio models failed, falling back to Gemini TTS...");
    try {
      const res = await callGeminiTTS(refinedText, voice, style, geminiKey);
      return { ...res, modelName: "gemini-2.5-flash-preview-tts" };
    } catch (e) {
      console.error("Final Gemini TTS Fallback failed:", e);
    }
  }

  throw new Error("All available TTS models and fallback failed.");
};

const callGeminiTTS = async (text: string, voice: string, style: string, apiKey: string) => {
  const ai = new GoogleGenAI({ apiKey });
  let styleInstruction = "Say cheerfully";
  if (style === 'horror') styleInstruction = "Say in a scary, whispering horror tone";
  if (style === 'deep') styleInstruction = "Say in a very deep, authoritative voice";
  if (style === 'singing') styleInstruction = "Sing this text like a professional singer";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `${styleInstruction}: ${text}` }] }],
    config: {
      responseModalities: ["AUDIO"] as any,
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice as any },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return { audio: base64Audio, isRawPcm: true };
  }
  throw new Error("Gemini generated no audio");
};

export const generateMultiFileProject = async (prompt: string) => {
  const systemPrompt = `You are a World-Class Full-Stack Software Architect.
  Your goal is to build a PRODUCTION-READY, HIGH-QUALITY multi-file project.
  
  CORE DIRECTIVES:
  1. Build a COMPLETE application, not a demo. Include advanced features, proper styling (Tailwind CSS), and robust logic.
  2. Use the most modern and stable tech stack (e.g., React + Vite + Tailwind + Lucide Icons).
  3. Ensure the UI is beautiful, responsive, and has a professional "SaaS" look.
  4. Implement real functionality: state management, API simulations, complex UI components, and animations (Framer Motion).
  5. Structure the code perfectly into multiple files (components, hooks, utils, types).
  
  OUTPUT FORMAT:
  You MUST return ONLY a valid JSON object with the following structure:
  {
    "tech_stack": "React + Vite + Tailwind CSS",
    "files": [
      {
        "path": "package.json",
        "content": "{...}"
      },
      {
        "path": "src/App.tsx",
        "content": "..."
      },
      {
        "path": "src/components/Dashboard.tsx",
        "content": "..."
      },
      {
        "path": "src/index.css",
        "content": "@import \"tailwindcss\"; ..."
      }
    ]
  }
  
  Do not return any text outside the JSON. Ensure all code is complete and functional.`;

  try {
    const res = await dynamicCall(prompt, "coding", systemPrompt, true);
    return parseJsonSafely(res.text);
  } catch (error) {
    console.error("Failed to generate multi-file project:", error);
    throw error;
  }
};
