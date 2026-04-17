import { handleApiError } from "../../lib/api";

export const aiApi = {
  chat: async (prompt: string): Promise<{ text: string }> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to generate chat response");
      }
      return res.json();
    } catch (error: any) {
      handleApiError(error, "Failed to generate chat response");
      throw error;
    }
  },

  generateStrategy: async (idea: string) => {
    try {
      const res = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
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

  generateLogo: async (name: string, idea: string) => {
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
  }
};
