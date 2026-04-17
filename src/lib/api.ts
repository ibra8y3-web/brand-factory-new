import { toast } from "sonner";

export const handleApiError = (error: any, defaultMessage: string) => {
  console.error("API Error:", error);
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    // Silently log network errors as per user request to avoid blocking UI with toasts
    console.warn("Network error encountered silently.");
  } else {
    // Only show toast for non-network errors if they are critical, or stay silent for model-heavy flows
    const isModelTask = defaultMessage?.toLowerCase().includes("model") || defaultMessage?.toLowerCase().includes("universal");
    if (!isModelTask) {
      toast.error(error.message || defaultMessage);
    }
  }
};
