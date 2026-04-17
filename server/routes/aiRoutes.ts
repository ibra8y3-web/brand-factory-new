import { Router } from "express";
import { Readable } from "stream";
import * as aiService from "../services/aiService";
import * as videoService from "../services/videoService";
import * as montageService from "../services/montageService";
import * as selfHealingService from "../services/selfHealingService";
import * as previewService from "../services/previewService";
import { getSupabase } from "../config/supabase.js";
import multer from "multer";
import os from "os";

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.get("/models", async (req, res) => {
  try {
    const client = getSupabase();
    const fetchAll = req.query.all === 'true';
    
    // Fetch in batches to bypass Supabase's default 1000 row limit
    let allModels: any[] = [];
    let from = 0;
    const step = 1000;
    
    while (from < 20000) {
      let query = client
        .from("ai_models")
        .select("*")
        .order("provider", { ascending: true })
        .range(from, from + step - 1);
        
      if (!fetchAll) {
        query = query.eq("is_active", true); // Only fetch active models unless requested otherwise
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allModels = [...allModels, ...data];
      console.log(`Fetched batch: ${from} to ${from + data.length - 1}. Total so far: ${allModels.length}`);
      if (data.length < step) break;
      from += step;
    }
    
    console.log(`Final models count to return: ${allModels.length}`);
    res.json(allModels);
  } catch (error: any) {
    console.error("Failed to fetch models:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

router.get("/proxy-video", async (req, res) => {
  const { url, apiKey } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send("Missing URL");
  }
  
  try {
    const headers: Record<string, string> = {};
    if (apiKey && typeof apiKey === 'string') {
      headers['x-goog-api-key'] = apiKey;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      return res.status(response.status).send(response.statusText);
    }
    
    // Pass along headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // Stream the response
    if (response.body) {
      if (typeof (response.body as any).pipe === 'function') {
        // It's a Node.js stream (e.g., from node-fetch)
        (response.body as any).pipe(res);
      } else {
        // It's a Web Stream (e.g., from native fetch)
        Readable.fromWeb(response.body as any).pipe(res);
      }
    } else {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error("Proxy video error:", error);
    res.status(500).send("Failed to proxy video");
  }
});

router.post("/generate-voice", async (req, res) => {
  const { text, voice, style } = req.body;
  try {
    const { audio, isRawPcm, modelName } = await aiService.generateSpeech(text, voice, style);
    res.json({ audio, isRawPcm, modelName });
  } catch (error: any) {
    console.error("Voice generation error:", error.message);
    res.status(500).json({ error: "Failed to generate audio" });
  }
});

router.post("/sdk/execute", async (req, res) => {
  const { api_key, prompt, taskType, systemPrompt, isJson, image } = req.body;
  
  if (!api_key) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    const model = await aiService.getModelByApiKey(api_key);
    if (!model) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Execute using the specific model found
    const result = await aiService.callAiModel(model, prompt, systemPrompt || "", isJson || false, [], 0, image || "");
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("SDK execution error:", error.message);
    res.status(500).json({ error: "Failed to execute model" });
  }
});

router.post("/sdk/generate-voice", async (req, res) => {
  const { api_key, text, voice, style } = req.body;
  
  if (!api_key) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    const model = await aiService.getModelByApiKey(api_key);
    if (!model) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Generate speech
    const { audio, isRawPcm, modelName } = await aiService.generateSpeech(text, voice || "Kore", style || "cheerful");
    res.json({ success: true, audio, isRawPcm, modelName });
  } catch (error: any) {
    console.error("SDK voice generation error:", error.message);
    res.status(500).json({ error: "Failed to generate voice" });
  }
});

router.post("/regenerate-api-key", async (req, res) => {
  const { modelId } = req.body;
  try {
    const model = await aiService.regenerateApiKey(modelId);
    res.json(model);
  } catch (error: any) {
    console.error("API key regeneration error:", error.message);
    res.status(500).json({ error: "Failed to regenerate API key" });
  }
});

router.get("/best-models", async (req, res) => {
  try {
    const taskTypes = ["general", "coding", "vision", "market", "seo", "content", "security", "video", "music", "voice"];
    const bestModels = await Promise.all(
      taskTypes.map(async (type) => {
        const model = await aiService.getBestModelForTask(type);
        return { type, model };
      })
    );
    res.json(bestModels);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch best models" });
  }
});

router.post("/update-models", async (req, res) => {
  try {
    const client = getSupabase();
    
    // Check if we synced recently (within the last 1 hour) to prevent deadlocks and unnecessary load
    const { data: recentModels } = await client
      .from("ai_models")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
      
    if (recentModels && recentModels.length > 0) {
      const lastUpdate = new Date(recentModels[0].updated_at).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastUpdate < 1000 && !req.body.force) { // Reduced to 1 second for testing
        return res.json({ 
          success: true, 
          message: "النماذج محدثة بالفعل (تم التحديث منذ أقل من 5 دقائق).",
          alreadySynced: true
        });
      }
    }

    console.log("Starting aggressive model sync from all providers...");

    // Fetch real models from providers in parallel to save time
    const [hfModels, orModels, groqModels, cometModels, openaiModels, anthropicModels] = await Promise.all([
      aiService.fetchHuggingFaceModels(),
      aiService.fetchOpenRouterModels(),
      aiService.fetchGroqModels(),
      aiService.fetchCometModels(),
      aiService.fetchOpenAIModels(),
      aiService.fetchAnthropicModels()
    ]);

    console.log(`Fetched: HF: ${hfModels.length}, OR: ${orModels.length}, Groq: ${groqModels.length}, Comet: ${cometModels.length}, OpenAI: ${openaiModels.length}, Anthropic: ${anthropicModels.length}`);

    // Map HF models to categories based on their names/ids
    const categorizedHfModels = hfModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("vision") || name.includes("image") || name.includes("vl") || name.includes("stable-diffusion") || name.includes("flux") || name.includes("vision_agent")) agent_type = "vision_agent";
      else if (name.includes("code") || name.includes("coder") || name.includes("script") || name.includes("python") || name.includes("javascript")) agent_type = "coder";
      else if ((name.includes("voice") && !name.includes("invoice")) || name.includes("tts") || name.includes("speech") || name.includes("audio")) agent_type = "voice";
      else if (name.includes("sentiment") || name.includes("market") || name.includes("finance") || name.includes("stock") || name.includes("crypto")) agent_type = "market";
      else if (name.includes("seo") || name.includes("rank") || name.includes("keyword") || name.includes("google-search")) agent_type = "seo";
      else if (name.includes("security") || name.includes("audit") || name.includes("vuln") || name.includes("pentest") || name.includes("malware")) agent_type = "security_agent";
      else if (name.includes("content") || name.includes("writer") || name.includes("blog") || name.includes("copywriter") || name.includes("creative")) agent_type = "content";
      return { ...m, agent_type, category: agent_type };
    });

    // Map OpenRouter models to categories
    const categorizedOrModels = orModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("vision") || name.includes("vl") || name.includes("image")) agent_type = "vision_agent";
      else if (name.includes("code") || name.includes("coder") || name.includes("script") || name.includes("llama-3.3") || name.includes("r1") || name.includes("qwen-2.5-coder") || name.includes("deepseek")) agent_type = "coder";
      else if (name.includes("reasoning") || name.includes("r1") || name.includes("deepseek-v3") || name.includes("o1")) agent_type = "coder";
      else if (name.includes("seo") || name.includes("rank") || name.includes("keyword")) agent_type = "seo";
      else if (name.includes("security") || name.includes("audit") || name.includes("firewall")) agent_type = "security_agent";
      else if (name.includes("content") || name.includes("writer") || name.includes("blog") || name.includes("story")) agent_type = "content";
      else if (name.includes("market") || name.includes("finance") || name.includes("business") || name.includes("strategy")) agent_type = "market";
      return { ...m, agent_type, category: agent_type };
    });

    // Map Groq models to categories
    const categorizedGroqModels = groqModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("vision")) agent_type = "vision_agent";
      else if (name.includes("code") || name.includes("coder") || name.includes("llama-3.3")) agent_type = "coder";
      else if (name.includes("content") || name.includes("instant")) agent_type = "content";
      else if (name.includes("market") || name.includes("versatile")) agent_type = "market";
      return { ...m, agent_type, category: agent_type };
    });

    // Map Comet models to categories
    const categorizedCometModels = cometModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("vision")) agent_type = "vision_agent";
      else if (name.includes("code") || name.includes("coder")) agent_type = "coder";
      else if (name.includes("seo")) agent_type = "seo";
      else if (name.includes("security")) agent_type = "security_agent";
      return { ...m, agent_type, category: agent_type };
    });

    // Map OpenAI models to categories
    const categorizedOpenAIModels = openaiModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("vision") || name.includes("gpt-4o")) agent_type = "vision_agent";
      else if (name.includes("code") || name.includes("o1")) agent_type = "coder";
      return { ...m, agent_type, category: agent_type };
    });

    // Map Anthropic models to categories
    const categorizedAnthropicModels = anthropicModels.map(m => {
      let agent_type = "general";
      const name = m.name.toLowerCase();
      if (name.includes("opus") || name.includes("sonnet")) agent_type = "coder";
      return { ...m, agent_type, category: agent_type };
    });

    // Define the initial seed models if database is empty
    const { count } = await client.from("ai_models").select("*", { count: "exact", head: true });
    
    if (count === 0) {
      const seedModels = [
        { name: "llama-3.3-70b-versatile", provider: "Groq", agent_type: "coder", is_active: true, is_verified: true, likes: 5000, api_url: "https://api.groq.com/openai/v1/chat/completions" },
        { name: "mixtral-8x7b-32768", provider: "Groq", agent_type: "general", is_active: true, is_verified: true, likes: 4500, api_url: "https://api.groq.com/openai/v1/chat/completions" },
        { name: "llama-3.3-70b-specdec", provider: "Groq", agent_type: "market", is_active: true, is_verified: true, likes: 4000, api_url: "https://api.groq.com/openai/v1/chat/completions" },
        { name: "llama-3.1-8b-instant", provider: "Groq", agent_type: "content", is_active: true, is_verified: true, likes: 3500, api_url: "https://api.groq.com/openai/v1/chat/completions" },
        { name: "gpt-3.5-turbo", provider: "Puter", agent_type: "general", is_active: true, is_verified: true, likes: 1300, api_url: "https://api.puter.com/v1/ai/chat" },
        { name: "claude-3-haiku-20240307", provider: "Puter", agent_type: "coder", is_active: true, is_verified: true, likes: 1150, api_url: "https://api.puter.com/v1/ai/chat" },
        { name: "gemini-1.5-flash", provider: "Gemini", agent_type: "general", is_active: true, is_verified: true, likes: 100, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" },
        { name: "gemini-1.5-pro", provider: "Gemini", agent_type: "coder", is_active: true, is_verified: true, likes: 50, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent" }
      ];
      await client.from("ai_models").upsert(seedModels, { onConflict: 'name' });
    }
    
    // Simple in-memory lock to prevent concurrent syncs
    if ((global as any).isSyncingModels) {
      return res.status(429).json({ error: "Sync in progress, please try again later." });
    }
    (global as any).isSyncingModels = true;
    
    try {
      const allModels = [
        ...categorizedHfModels, 
        ...categorizedCometModels,
        ...categorizedOrModels, 
        ...categorizedGroqModels, 
        ...categorizedOpenAIModels,
        ...categorizedAnthropicModels
      ]
        .filter(m => {
          const name = m.name.toLowerCase();
          // Exclude whisper and stt models that aren't general LLMs or TTS
          // But allow if they are categorized as voice/audio
          if (m.agent_type === "voice" || m.category === "audio") return true;
          return !name.includes("whisper") && !name.includes("stt");
        });
      
      // Prioritize providers during deduplication
      // Order of priority (highest last): Hugging Face < CometAPI < OpenRouter < OpenAI < Anthropic < Groq < Gemini
      const providerPriority: Record<string, number> = {
        "CometAPI": 1,
        "OpenRouter": 2,
        "Hugging Face": 3,
        "OpenAI": 4,
        "Anthropic": 5,
        "Groq": 6,
        "Gemini": 7,
        "Puter": 8,
        "Agent_System": 9
      };

      const finalModelsToSync = [...allModels];
      
      // Add Gemini TTS models explicitly to the sync list
      const geminiModels = [
        { name: "gemini-1.5-flash", provider: "Gemini", agent_type: "general", is_active: true, is_verified: true, likes: 1500, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" },
        { name: "gemini-1.5-pro", provider: "Gemini", agent_type: "coder", is_active: true, is_verified: true, likes: 1400, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent" },
        { name: "gemini-2.0-flash-exp", provider: "Gemini", agent_type: "general", is_active: true, is_verified: true, likes: 1600, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent" },
        { name: "gemini-2.5-flash-preview-tts", provider: "Gemini", agent_type: "voice", is_active: true, is_verified: true, likes: 2000, api_url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent" },
        { name: "veo-3.1-lite-generate-preview", provider: "Gemini", agent_type: "video", is_active: true, is_verified: true, likes: 3000, api_url: "https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-lite-generate-preview:generateVideos" },
        { name: "lyria-3-clip-preview", provider: "Gemini", agent_type: "music", is_active: true, is_verified: true, likes: 2500, api_url: "https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent" },
        { name: "lyria-3-pro-preview", provider: "Gemini", agent_type: "music", is_active: true, is_verified: true, likes: 2500, api_url: "https://generativelanguage.googleapis.com/v1beta/models/lyria-3-pro-preview:generateContent" }
      ];
      
      finalModelsToSync.push(...geminiModels);
      
      // Deduplicate with priority
      const modelMap = new Map<string, any>();
      for (const m of finalModelsToSync) {
        const existing = modelMap.get(m.name);
        if (!existing || (providerPriority[m.provider] || 0) > (providerPriority[existing.provider] || 0)) {
          modelMap.set(m.name, m);
        }
      }
      const uniqueAllModels = Array.from(modelMap.values());
      console.log(`Syncing ${uniqueAllModels.length} models to database...`);
      
      // Fetch existing inactive models to avoid re-activating them (using batches)
      let inactiveNames = new Set<string>();
      let inactiveFrom = 0;
      while (true) {
        const { data: inactiveModels, error: inactiveError } = await client
          .from("ai_models")
          .select("name")
          .eq("is_active", false)
          .range(inactiveFrom, inactiveFrom + 999);
        
        if (inactiveError) break;
        if (!inactiveModels || inactiveModels.length === 0) break;
        
        inactiveModels.forEach(m => inactiveNames.add(m.name));
        if (inactiveModels.length < 1000) break;
        inactiveFrom += 1000;
      }
      
      // Filter out models that are already marked as inactive
      const modelsToUpsert = uniqueAllModels.filter(m => !inactiveNames.has(m.name));
      
      const { count: beforeCount } = await client.from("ai_models").select("*", { count: "exact", head: true });
      console.log(`Models in DB before sync: ${beforeCount}`);
      
      // 1. First, mark ALL models from these specific providers as inactive
      // BUT exclude those that are permanently deleted
      const providersToSync = ["Hugging Face", "OpenRouter", "Groq", "CometAPI", "Gemini", "Anthropic", "OpenAI"];
      await client
        .from("ai_models")
        .update({ is_active: false })
        .in("provider", providersToSync)
        .eq("is_permanently_deleted", false);
  
      // 2. Upsert the new models as active, but only if they are not permanently deleted
      // Use chunks for large upserts to avoid payload limits
      const chunkSize = 100;
      for (let i = 0; i < modelsToUpsert.length; i += chunkSize) {
        const chunk = modelsToUpsert.slice(i, i + chunkSize);
        
        // Filter out permanently deleted models from the sync chunk
        const filteredChunk = chunk.filter(m => !inactiveNames.has(m.name));
        
        const { error } = await client.from("ai_models").upsert(filteredChunk, { onConflict: 'name' });
        if (error) throw error;
      }
      
      const { count: afterCount } = await client.from("ai_models").select("*", { count: "exact", head: true });
      console.log(`Models in DB after sync: ${afterCount}`);
  
      // Check API connectivity status
      const status = {
        gemini: !!process.env.GEMINI_API_KEY ? "Connected" : "Missing Key",
        groq: !!process.env.GROQ_API_KEY ? "Connected" : "Missing Key",
        comet: !!process.env.COMET_API_KEY ? "Connected" : "Missing Key",
        huggingface: !!process.env.HUGGINGFACE_API_KEY ? "Connected" : "Missing Key",
        openrouter: !!process.env.OPENROUTER_API_KEY ? "Connected" : "Missing Key",
        supabase: !!process.env.VITE_SUPABASE_URL ? "Connected" : "Missing Config"
      };
  
      res.json({ 
        success: true, 
        message: `تم سحب ومزامنة ${uniqueAllModels.length} نموذج حقيقي من جميع المزودين بنجاح.`,
        status,
        syncedCount: uniqueAllModels.length
      });
    } finally {
      (global as any).isSyncingModels = false;
    }
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    res.status(500).json({ error: "فشل في مزامنة النماذج مع قاعدة البيانات." });
  }
});

router.post("/validate-key", async (req, res) => {
  const { provider, key } = req.body;
  try {
    const isValid = await aiService.validateApiKey(provider, key);
    res.json({ isValid });
  } catch (error) {
    res.status(500).json({ error: "Validation failed" });
  }
});

router.post("/report-failure", async (req, res) => {
  const { modelName } = req.body;
  try {
    await aiService.markModelAsInactive(modelName);
    res.json({ success: true, message: `Model ${modelName} marked as inactive.` });
  } catch (error) {
    res.status(500).json({ error: "Failed to report failure" });
  }
});

router.post("/chat", async (req, res) => {
  const { prompt, taskType } = req.body;
  try {
    const text = await aiService.generateChatResponse(prompt, taskType);
    res.json({ text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate chat response" });
  }
});

router.post("/vision-chat", async (req, res) => {
  const { prompt, image } = req.body;
  try {
    const result = await aiService.dynamicCall(prompt, "vision", "", false, image);
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Vision Chat Error with dynamicCall, falling back to Gemini:", error);
    try {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
      if (!geminiKey) throw new Error("No Gemini API key available for fallback");
      
      const { GoogleGenAI } = require("@google/genai");
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const parts: any[] = [{ text: prompt }];
      if (image) {
        const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        });
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts }
      });
      
      res.json({ text: response.text });
    } catch (fallbackError: any) {
      console.error("Vision Chat Fallback Error:", fallbackError);
      res.status(500).json({ error: fallbackError.message || "Failed to generate vision chat response. All models failed." });
    }
  }
});

router.post("/global-search", async (req, res) => {
  const { query } = req.body;
  try {
    const text = await aiService.globalSearch(query);
    res.json({ text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to perform global search" });
  }
});

router.post("/generate-video", async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await videoService.createStandaloneVideo(prompt);
    res.json(result);
  } catch (error: any) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: error.message || "Failed to generate video" });
  }
});

router.post("/generate-music", async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await aiService.dynamicCall(prompt, "music", "", false);
    res.json(result);
  } catch (error: any) {
    console.error("Error generating music:", error);
    res.status(500).json({ error: error.message || "Failed to generate music" });
  }
});

router.post("/aitube/generate", async (req, res) => {
  const { prompt } = req.body;
  try {
    const result = await videoService.createFullAITube(prompt);
    res.json(result);
  } catch (error: any) {
    console.error("Error in AITube pipeline:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI Tube content" });
  }
});

router.post("/montage/generate", async (req, res) => {
  const { clips, musicStyle } = req.body;
  try {
    const result = await montageService.createMontage(clips, musicStyle);
    res.json(result);
  } catch (error: any) {
    console.error("Error in Montage generation:", error);
    res.status(500).json({ error: error.message || "Failed to generate montage" });
  }
});

router.post("/aitube/process", upload.single("file"), async (req: any, res) => {
  const { url, mode } = req.body;
  const file = req.file;

  try {
    let input: string | { path: string; originalName: string };
    if (file) {
      input = { path: file.path, originalName: file.originalname };
    } else if (url) {
      input = url;
    } else {
      return res.status(400).json({ error: "No input provided" });
    }

    const result = await videoService.processMovie(input, mode);
    res.json(result);
  } catch (error: any) {
    console.error("Error in AITube processing:", error);
    res.status(500).json({ error: error.message || "Failed to process movie" });
  }
});

router.post("/generate-strategy", async (req, res) => {
  const { idea } = req.body;
  try {
    const strategy = await aiService.generateStrategy(idea);
    res.json(strategy);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate strategy" });
  }
});

router.post("/generate-content", async (req, res) => {
  const { topic, tone } = req.body;
  try {
    const content = await aiService.generateContent(topic, tone);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate content" });
  }
});

router.post("/optimize-seo", async (req, res) => {
  const { content, keywords } = req.body;
  try {
    const seoData = await aiService.optimizeSEO(content, keywords);
    res.json(seoData);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to optimize SEO" });
  }
});

router.post("/analyze-market", async (req, res) => {
  const { industry, region } = req.body;
  try {
    const marketData = await aiService.analyzeMarket(industry, region);
    res.json(marketData);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze market" });
  }
});

router.post("/generate-logo", async (req, res) => {
  const { name, idea } = req.body;
  try {
    const logoUrl = await aiService.generateLogo(name, idea);
    res.json({ logoUrl });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate logo" });
  }
});

router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const imageUrl = await aiService.generateImage(prompt);
    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate image" });
  }
});

router.post("/analyze-sentiment", async (req, res) => {
  const { idea } = req.body;
  try {
    const sentiment = await aiService.analyzeSentiment(idea);
    res.json(sentiment);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

router.post("/generate-project", async (req, res) => {
  const { prompt, type } = req.body;
  try {
    const result = await aiService.generateProject(prompt, type);
    if (type === "json") {
      res.json({ appStructure: result });
    } else {
      res.json({ html: result });
    }
  } catch (error: any) {
    res.status(500).json({ error: "فشل في توليد واجهة المستخدم." });
  }
});

router.post("/generate-multi-file-project", async (req, res) => {
  const { prompt } = req.body;
  try {
    const project = await aiService.generateMultiFileProject(prompt);
    res.json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate multi-file project" });
  }
});

router.post("/analyze-code", async (req, res) => {
  const { code } = req.body;
  try {
    const fixedCode = await aiService.validateAndFixCode(code);
    res.json({ success: true, fixedCode });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze code" });
  }
});

router.post("/analyze-security", async (req, res) => {
  const { code } = req.body;
  try {
    const securityReport = await aiService.analyzeSecurity(code);
    res.json(securityReport);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to analyze security" });
  }
});

router.post("/self-healing", async (req, res) => {
  const { logs } = req.body;
  try {
    const result = await selfHealingService.analyzeAndFixCode(logs);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to perform self-healing" });
  }
});

router.post("/webhooks/build-failure", async (req, res) => {
  try {
    // Basic webhook handling
    console.log("Received build failure webhook:", JSON.stringify(req.body, null, 2));
    
    // In a real scenario, we would verify the signature here
    // const signature = req.headers["x-hub-signature-256"];
    
    await selfHealingService.handleBuildFailureWebhook(req.body);
    
    res.status(200).send("Webhook received");
  } catch (error: any) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

router.post("/preview", async (req, res) => {
  const { files, framework } = req.body;
  try {
    const projectPath = await previewService.saveFiles(files);
    const result = await previewService.buildAndRunPreview(projectPath, framework) as any;
    res.json({ ...result, projectPath });
  } catch (error: any) {
    console.error("Preview Error:", error);
    res.status(500).json({ error: "Failed to build preview" });
  }
});

router.post("/agent-swarm", async (req, res) => {
  const { task } = req.body;
  try {
    const prompt = `You are an AI Swarm Orchestrator. Break down the following large task into smaller sub-tasks for a team of specialized AI agents.
      Task: ${task}
      
      Return a JSON object with:
      - 'plan': string (overall strategy)
      - 'agents': Array of { name: string, role: string, task: string }`;
      
    const result = await aiService.dynamicCall(prompt, "general", "", true);
    res.json(typeof result.text === 'string' ? JSON.parse(result.text) : result.text);
  } catch (error: any) {
    console.error("Swarm Error:", error);
    res.status(500).json({ error: "Failed to orchestrate swarm" });
  }
});

router.post("/execute-universal", async (req, res) => {
  const { prompt, taskType, systemPrompt, isJson, image, modelName } = req.body;
  try {
    const result = await aiService.dynamicCall(prompt, taskType || "general", systemPrompt || "", isJson || false, image || "", modelName);
    res.json(result);
  } catch (error: any) {
    console.error(`Universal Execution Error (${taskType}):`, error.message);
    res.status(500).json({ error: error.message || "Failed to execute universal task" });
  }
});

router.post("/toggle-model", async (req, res) => {
  const { modelId, isActive } = req.body;
  try {
    const client = getSupabase();
    const { error } = await client
      .from("ai_models")
      .update({ is_active: isActive })
      .eq("id", modelId);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
