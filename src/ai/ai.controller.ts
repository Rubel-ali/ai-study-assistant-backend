import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateSubjectsDto } from './dto/generate-subjects.dto';
import { GenerateTopicsDto } from './dto/generate-topics.dto';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('ask')
  @UseInterceptors(FileInterceptor('file'))
  async ask(
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
    @Body('prompt') prompt?: string,
  ) {
    const userId = req.user.sub;
    
    const aiResponse = await this.aiService.processMultiModalInput(file, prompt);

    const interaction = await this.prisma.aiInteraction.create({
      data: {
        userId,
        prompt: prompt || null,
        fileType: file ? file.mimetype : null,
        aiResponse,
      },
    });

    return {
      success: true,
      data: interaction,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('generate-subjects')
  async generateSubjects(@Req() req: any, @Body() dto: GenerateSubjectsDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Admins can auto-generate subjects');
    }
    return this.aiService.generateSubjects(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('generate-topics')
  async generateTopics(@Req() req: any, @Body() dto: GenerateTopicsDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Admins can auto-generate topics');
    }
    return this.aiService.generateTopics(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('generate-questions')
  async generateQuestions(@Req() req: any, @Body() dto: GenerateQuestionsDto) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only Admins can auto-generate questions');
    }
    return this.aiService.generateQuestions(dto);
  }
}
