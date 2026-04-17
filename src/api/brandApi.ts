import { toast } from "sonner";
import { handleApiError } from "../lib/api";
import { getSupabase } from "../lib/supabase";

export interface BrandStrategy {
  name: string;
  slogan: string;
  marketingSteps: string[];
  targetAudience: string;
  brandVoice?: string;
  poetry?: string;
  clarifyingQuestions?: string[];
  alternativeStrategies?: { name: string; description: string }[];
}

export interface DeploymentDetails {
  description: string;
  available_models_count: number;
  assigned_logic: string;
  assigned_vision: string;
  logoUrl?: string;
  sentiment?: any;
}

export const brandApi = {
  initializeBrand: async (projectName: string, description: string) => {
    try {
      const res = await fetch("/api/initialize-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, description }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details ? `${error.error} - ${error.details}` : (error.error || "Failed to initialize brand"));
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to initialize brand");
      throw error;
    }
  },

  generateStrategy: async (idea: string, niche?: string, brandVoice?: string): Promise<BrandStrategy> => {
    try {
      const res = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, niche, brandVoice }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate strategy");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate strategy");
      throw error;
    }
  },

  generateContent: async (topic: string, tone: string) => {
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, tone }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate content");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate content");
      throw error;
    }
  },

  optimizeSEO: async (content: string, keywords: string[]) => {
    try {
      const res = await fetch("/api/optimize-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, keywords }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to optimize SEO");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to optimize SEO");
      throw error;
    }
  },

  analyzeMarket: async (industry: string, region: string) => {
    try {
      const res = await fetch("/api/analyze-market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, region }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze market");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to analyze market");
      throw error;
    }
  },

  regenerateApiKey: async (modelId: string) => {
    try {
      const res = await fetch("/api/regenerate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to regenerate API key");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to regenerate API key");
      throw error;
    }
  },

  updateModels: async (force: boolean = false) => {
    try {
      const res = await fetch("/api/update-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force })
      });
      if (res.status === 429) {
        console.warn("Sync in progress, skipping.");
        return { success: false, message: "Sync in progress" };
      }
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update models");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to update models");
      throw error;
    }
  },

  reportFailure: async (modelName: string) => {
    try {
      const res = await fetch("/api/report-failure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to report failure");
      }
      return res.json();
    } catch (error: any) {
      console.error("Failed to report model failure:", error);
    }
  },

  subscribeToModels: (callback: (payload: any) => void) => {
    const supabase = getSupabase();
    return supabase
      .channel('ai_models_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_models' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  subscribeToDeployments: (callback: (payload: any) => void) => {
    const supabase = getSupabase();
    return supabase
      .channel('deployments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deployments' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  subscribeToBrands: (callback: (payload: any) => void) => {
    const supabase = getSupabase();
    return supabase
      .channel('active_brands_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_brands' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  },

  validateKey: async (provider: string, key: string): Promise<{ isValid: boolean }> => {
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to validate key");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to validate key");
      throw error;
    }
  },

  getModels: async (all: boolean = false) => {
    try {
      const res = await fetch(`/api/models${all ? '?all=true' : ''}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch models");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to fetch models");
      throw error;
    }
  },

  generateLogo: async (name: string, idea: string): Promise<{ logoUrl: string }> => {
    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, idea }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate logo");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate logo");
      throw error;
    }
  },

  generateImage: async (prompt: string): Promise<{ imageUrl: string }> => {
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate image");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate image");
      throw error;
    }
  },

  analyzeSentiment: async (idea: string) => {
    try {
      const res = await fetch("/api/analyze-sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze sentiment");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to analyze sentiment");
      throw error;
    }
  },

  generateProject: async (prompt: string, type: "json" | "html") => {
    try {
      const res = await fetch("/api/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate project");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate project");
      throw error;
    }
  },

  generateMultiFileProject: async (prompt: string) => {
    try {
      const res = await fetch("/api/generate-multi-file-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate multi-file project");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate multi-file project");
      throw error;
    }
  },

  executeUniversal: async (params: { prompt: string; taskType: string; systemPrompt?: string; isJson?: boolean; image?: string; modelName?: string }): Promise<any> => {
    try {
      const res = await fetch("/api/execute-universal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        if (params.modelName) await brandApi.reportFailure(params.modelName);
        const error = await res.json();
        throw new Error(error.error || "Failed to execute universal task");
      }
      return res.json();
    } catch (error: any) {
      if (params.modelName) await brandApi.reportFailure(params.modelName);
      handleApiError(error, "Failed to execute universal task");
      throw error;
    }
  },

  deploy: async (projectName: string, details: any, htmlContent: string, features: any, codeQualityScore: number, projectFiles?: any) => {
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, details, htmlContent, features, codeQualityScore, projectFiles }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to deploy");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to deploy");
      throw error;
    }
  },

  analyzeCode: async (code: string) => {
    try {
      const res = await fetch("/api/analyze-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze code");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to analyze code");
      throw error;
    }
  },

  analyzeSecurity: async (code: string) => {
    try {
      const res = await fetch("/api/analyze-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze security");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to analyze security");
      throw error;
    }
  },

  chat: async (prompt: string, taskType: string = "general", modelName?: string): Promise<{ text: string; modelUsed: string }> => {
    return brandApi.executeUniversal({ prompt, taskType, modelName });
  },

  generateChat: async (prompt: string, taskType: string = "general", modelName?: string): Promise<{ text: string; modelUsed: string }> => {
    return brandApi.executeUniversal({ prompt, taskType, modelName });
  },

  visionChat: async (prompt: string, image: string, modelName?: string): Promise<{ text: string; modelUsed: string }> => {
    return brandApi.executeUniversal({ prompt, image, taskType: "vision", modelName });
  },

  globalSearch: async (query: string, modelName?: string): Promise<{ text: string; modelUsed: string }> => {
    return brandApi.executeUniversal({ prompt: query, taskType: "search", modelName });
  },

  generateVideo: async (prompt: string, modelName?: string): Promise<any> => {
    return brandApi.executeUniversal({ prompt, taskType: "video", modelName });
  },

  generateMusic: async (prompt: string): Promise<any> => {
    return brandApi.executeUniversal({ prompt, taskType: "music" });
  },

  generateAITube: async (prompt: string): Promise<{ video: string; script: string; id: string }> => {
    try {
      const res = await fetch("/api/aitube/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate AI Tube content");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate AI Tube content");
      throw error;
    }
  },

  processAITube: async (input: string | File, mode: 'summarize' | 'shorten' | 'compress', modelName?: string): Promise<{ video: string; text: string; id: string }> => {
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      if (typeof input === 'string') {
        formData.append("url", input);
      } else {
        formData.append("file", input);
      }
      if (modelName) formData.append("modelName", modelName);

      const res = await fetch("/api/aitube/process", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to process AI Tube content");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to process AI Tube content");
      throw error;
    }
  },

  generateMontage: async (clips: { prompt: string; duration: number }[], musicStyle: string): Promise<{ video: string; id: string }> => {
    try {
      const res = await fetch("/api/montage/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clips, musicStyle }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate montage");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate montage");
      throw error;
    }
  },

  runSystemDiagnostics: async (logs: string): Promise<{ fixedCode?: string, analysis?: string }> => {
    try {
      const res = await fetch("/api/self-healing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      if (!res.ok) throw new Error("Failed to run diagnostics");
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to run diagnostics");
      throw error;
    }
  },

  getRecentProjects: async () => {
    try {
      const res = await fetch("/api/recent-projects");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch recent projects");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to fetch recent projects");
      throw error;
    }
  },

  /**
   * Conceptual Model Orchestrator
   * Routes tasks to the most suitable model based on complexity and cost.
   * This ensures the system is future-proof and can integrate any new AI.
   */
  routeTaskToModel: async (task: string, complexity: 'low' | 'medium' | 'high') => {
    console.log(`Routing task: "${task}" with complexity: ${complexity}`);
    // Logic to select best model (e.g., Groq for speed, Gemini for reasoning, etc.)
    // This is managed by the "Unified AI Standard" defined in README.md
    return { selectedModel: complexity === 'high' ? 'gemini-3.1-pro' : 'groq-llama3-70b' };
  },

  addModel: async (modelData: { name: string, provider: string, apiUrl: string, tokenization: string, agentType?: string }) => {
    try {
      const res = await fetch("/api/add-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add model");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to add model");
      throw error;
    }
  },

  generateApiStudio: async (description: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate API Studio assets for: ${description}. Return a JSON object with 'integrationCode' (TypeScript) and 'documentation' (Markdown).`,
          taskType: "coding"
        }),
      });
      if (!res.ok) throw new Error("Failed to generate API assets");
      const data = await res.json();
      return JSON.parse(data.text);
    } catch (error: any) {
      handleApiError(error, "Failed to generate API assets");
      throw error;
    }
  },

  generateReadme: async (projectFiles: any[]) => {
    try {
      const filesSummary = projectFiles.map(f => `File: ${f.path}\nContent: ${f.content.slice(0, 500)}...`).join('\n\n');
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a professional README.md for this project based on these files:\n\n${filesSummary}`,
          taskType: "content"
        }),
      });
      if (!res.ok) throw new Error("Failed to generate README");
      const data = await res.json();
      return { readme: data.text };
    } catch (error: any) {
      handleApiError(error, "Failed to generate README");
      throw error;
    }
  },

  generateUserGuide: async (projectFiles: any[]) => {
    try {
      const filesSummary = projectFiles.map(f => `File: ${f.path}\nContent: ${f.content.slice(0, 500)}...`).join('\n\n');
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a comprehensive User Guide for this application based on these files:\n\n${filesSummary}`,
          taskType: "content"
        }),
      });
      if (!res.ok) throw new Error("Failed to generate User Guide");
      const data = await res.json();
      return { guide: data.text };
    } catch (error: any) {
      handleApiError(error, "Failed to generate User Guide");
      throw error;
    }
  },

  analyzeDeepLogic: async (code: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Perform a deep logic analysis on this code. Identify potential edge cases, logical flaws, and optimization opportunities. Return a JSON object with 'analysis' and 'recommendations'.`,
          taskType: "coding"
        }),
      });
      if (!res.ok) throw new Error("Failed to analyze deep logic");
      const data = await res.json();
      return JSON.parse(data.text);
    } catch (error: any) {
      handleApiError(error, "Failed to analyze deep logic");
      throw error;
    }
  },

  transpileProject: async (projectFiles: any[], targetStack: string) => {
    try {
      const filesSummary = projectFiles.map(f => `File: ${f.path}\nContent: ${f.content.slice(0, 500)}...`).join('\n\n');
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Transpile the following project to ${targetStack}. Return a JSON object with a 'files' array, where each item has 'path' and 'content'.\n\nProject Files:\n${filesSummary}`,
          taskType: "coding"
        }),
      });
      if (!res.ok) throw new Error("Failed to transpile project");
      const data = await res.json();
      return JSON.parse(data.text);
    } catch (error: any) {
      handleApiError(error, "Failed to transpile project");
      throw error;
    }
  },

  toggleModel: async (modelId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/toggle-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId, isActive }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to toggle model");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to toggle model");
      throw error;
    }
  },

  getBestModels: async () => {
    try {
      const res = await fetch("/api/best-models");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch best models");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to fetch best models");
      throw error;
    }
  },

  previewProject: async (files: { path: string; content: string }[], framework: string) => {
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, framework }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate preview");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate preview");
      throw error;
    }
  },

  post: async (url: string, body: any) => {
    try {
      const res = await fetch(`/api${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to post to ${url}`);
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, `Failed to post to ${url}`);
      throw error;
    }
  }
};
