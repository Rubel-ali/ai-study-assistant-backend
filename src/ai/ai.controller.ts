import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

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
}
