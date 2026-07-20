import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async processMultiModalInput(file?: Express.Multer.File, prompt?: string): Promise<string> {
    if (!file && !prompt) {
      throw new BadRequestException('Provide at least a file or a text prompt');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
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
      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}
