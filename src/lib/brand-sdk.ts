/**
 * OmniVerse Aether Core - Brand SDK v1.0
 * 
 * This SDK allows you to integrate OmniVerse AI features into your own applications.
 * Features:
 * - Text Generation (Universal Engine)
 * - Voice Synthesis (Professional TTS)
 * - Image & Video Generation
 */

export interface BrandSDKConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ExecuteParams {
  prompt: string;
  taskType?: 'general' | 'coding' | 'vision' | 'audio' | 'video' | 'music' | 'market' | 'seo';
  systemPrompt?: string;
  isJson?: boolean;
  image?: string;
}

export class BrandSDK {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: BrandSDKConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || window.location.origin;
  }

  /**
   * Execute a universal AI task
   */
  async execute(params: ExecuteParams) {
    const response = await fetch(`${this.baseUrl}/api/sdk/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        ...params
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to execute task');
    }

    return response.json();
  }

  /**
   * Generate professional voice synthesis
   */
  async generateVoice(text: string, voice: string = "Kore", style: string = "cheerful") {
    const response = await fetch(`${this.baseUrl}/api/sdk/generate-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        text,
        voice,
        style
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate voice');
    }

    return response.json();
  }

  /**
   * Utility to play base64 audio
   */
  playAudio(base64: string, isRawPcm: boolean = false) {
    const audio = new Audio();
    if (isRawPcm) {
      // For raw PCM, we'd need a wrapper or use Web Audio API
      // For simplicity in the SDK, we assume the backend might return a data URL or we wrap it
      audio.src = `data:audio/wav;base64,${base64}`;
    } else {
      audio.src = base64.startsWith('data:') ? base64 : `data:audio/mpeg;base64,${base64}`;
    }
    audio.play();
    return audio;
  }
}

// Usage Example:
/*
const sdk = new BrandSDK({ apiKey: 'your_api_key' });
const result = await sdk.execute({ prompt: 'Hello world' });
console.log(result.result.text);

const voice = await sdk.generateVoice('Welcome to OmniVerse');
sdk.playAudio(voice.audio, voice.isRawPcm);
*/
