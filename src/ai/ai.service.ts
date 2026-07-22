import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateSubjectsDto } from './dto/generate-subjects.dto';
import { GenerateTopicsDto } from './dto/generate-topics.dto';

@Injectable()
export class AiService {
  private apiKeys: string[];
  private currentKeyIndex = 0;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
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
              throw new Error('QUOTA_EXCEEDED');
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
      console.warn(`[AI Service] gemini-2.0-flash failed (${error.message}). Falling back to gemini-flash-latest...`);
      try {
        return await this.attemptGenerateContent('gemini-flash-latest', parts);
      } catch (fallbackError: any) {
        if (fallbackError.message === 'QUOTA_EXCEEDED') {
          throw new InternalServerErrorException(
            'Google AI Quota Exceeded on all available API keys. Please check your billing plan.'
          );
        }
        if (fallbackError instanceof InternalServerErrorException) {
          throw fallbackError;
        }
        throw new InternalServerErrorException(`AI processing failed on all fallback models. Last error: ${fallbackError.message}`);
      }
    }
  }

  private async generateJsonContent(prompt: string): Promise<any> {
    const parts: Part[] = [{ text: prompt }];
    let rawText = '';
    try {
      rawText = await this.attemptGenerateContent('gemini-2.0-flash', parts);
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      console.warn(`[AI Service] gemini-2.0-flash failed (${error.message}). Falling back to gemini-flash-latest...`);
      try {
        rawText = await this.attemptGenerateContent('gemini-flash-latest', parts);
      } catch (fallbackError: any) {
        if (fallbackError.message === 'QUOTA_EXCEEDED') {
          throw new InternalServerErrorException(
            'Google AI Quota Exceeded on all available API keys. Please check your billing plan.'
          );
        }
        if (fallbackError instanceof InternalServerErrorException) {
          throw fallbackError;
        }
        throw new InternalServerErrorException(`AI processing failed on all fallback models. Last error: ${fallbackError.message}`);
      }
    }

    try {
      // Strip markdown code block wrappers if they exist
      const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Failed to parse JSON from AI output:', rawText);
      throw new InternalServerErrorException('AI returned invalid JSON format');
    }
  }

  async generateSubjects(dto: GenerateSubjectsDto) {
    const prompt = `
      You are an expert curriculum designer. 
      Given the Category "${dto.categoryName}" and Sub-Category "${dto.subCategoryName}", 
      generate a list of 5 to 10 core academic subjects that belong to this sub-category.
      
      Respond STRICTLY in JSON format matching this schema:
      {
        "subjects": [
          { "name": "Subject Name", "code": "SUB-CODE" }
        ]
      }
      Ensure the "code" is a short, uppercase identifier (e.g., MATH, PHYS, HIST). Do not wrap the JSON in markdown code blocks.
    `;

    const parsed = await this.generateJsonContent(prompt);
    if (!parsed || !Array.isArray(parsed.subjects)) {
      throw new InternalServerErrorException('AI failed to generate a valid list of subjects');
    }

    const subjectsData = parsed.subjects.map((s: any) => ({
      name: s.name,
      code: `${s.code}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      subCategoryId: dto.subCategoryId,
    }));

    await this.prisma.subject.createMany({
      data: subjectsData,
      skipDuplicates: true,
    });

    return { success: true, count: subjectsData.length, subjects: subjectsData };
  }

  async generateTopics(dto: GenerateTopicsDto) {
    const prompt = `
      You are an expert curriculum designer. 
      Given the Category/Sub-Category context "${dto.subCategoryName}", 
      and specifically for the Subject "${dto.subjectName}", 
      generate a comprehensive list of 10 to 20 key exam topics.
      
      Respond STRICTLY in JSON format matching this schema:
      {
        "topics": [
          { "name": "Topic Name", "description": "A short, 1-sentence description of the topic" }
        ]
      }
      Do not wrap the JSON in markdown code blocks.
    `;

    const parsed = await this.generateJsonContent(prompt);
    if (!parsed || !Array.isArray(parsed.topics)) {
      throw new InternalServerErrorException('AI failed to generate a valid list of topics');
    }

    const topicsData = parsed.topics.map((t: any) => ({
      name: t.name,
      description: t.description,
      subjectId: dto.subjectId,
    }));

    await this.prisma.topic.createMany({
      data: topicsData,
      skipDuplicates: true,
    });

    return { success: true, count: topicsData.length, topics: topicsData };
  }
}
