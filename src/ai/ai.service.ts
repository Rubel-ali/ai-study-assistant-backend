import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

@Injectable()
export class AiService {
  private apiKeys: string[];
  private currentKeyIndex = 0;

  constructor(private configService: ConfigService) {
    const keysString = this.configService.get<string>('GEMINI_API_KEYS') || this.configService.get<string>('GEMINI_API_KEY');
    if (!keysString) {
      throw new Error('GEMINI_API_KEY or GEMINI_API_KEYS must be defined in environment variables');
    }
    this.apiKeys = keysString.split(',').map(k => k.trim()).filter(k => k);
    if (this.apiKeys.length === 0) {
      throw new Error('No valid API keys found');
    }
  }

  private async attemptGenerateContent(modelName: string, parts: Part[]): Promise<string> {
    let keysTried = 0;

    while (keysTried < this.apiKeys.length) {
      const currentKey = this.apiKeys[this.currentKeyIndex];
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      let serverRetries = 0;
      while (serverRetries < 3) {
        try {
          const result = await model.generateContent(parts);
          const response = await result.response;
          return response.text();
        } catch (error: any) {
          const message = error.message.toLowerCase();
          
          if (message.includes('429') || message.includes('quota')) {
            console.warn(`[AI Service] API Key at index ${this.currentKeyIndex} hit quota limit. Rotating key...`);
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            keysTried++;
            if (keysTried >= this.apiKeys.length) {
              throw new InternalServerErrorException(
                'Google AI Quota Exceeded on all available API keys. Please check your billing plan.'
              );
            }
            break; // Break inner retry loop to switch to the new key
          }

          serverRetries++;
          if (
            (message.includes('503') || message.includes('high demand') || message.includes('overloaded')) && 
            serverRetries < 3
          ) {
            console.warn(`[AI Service] ${modelName} is busy. Retrying (${serverRetries}/3) in 2 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }
    }
    throw new Error('Retries exhausted');
  }

  async processMultiModalInput(file?: Express.Multer.File, prompt?: string): Promise<string> {
    if (!file && !prompt) {
      throw new BadRequestException('Provide at least a file or a text prompt');
    }

    const parts: Part[] = [];

    if (prompt) {
      parts.push({ text: prompt });
    }

    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        },
      });
    }

    try {
      return await this.attemptGenerateContent('gemini-2.0-flash', parts);
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.warn(`[AI Service] gemini-2.0-flash failed (${error.message}). Falling back to gemini-1.5-flash-8b...`);
      try {
        return await this.attemptGenerateContent('gemini-1.5-flash-8b', parts);
      } catch (fallbackError: any) {
        if (fallbackError instanceof InternalServerErrorException) {
          throw fallbackError;
        }
        throw new InternalServerErrorException(`AI processing failed on all fallback models. Last error: ${fallbackError.message}`);
      }
    }
  }
}
