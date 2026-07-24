import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateBulkQuestionsDto } from './dto/create-bulk-questions.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('bulk-manual')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async createBulkManual(@Body() createBulkQuestionsDto: CreateBulkQuestionsDto) {
    return this.questionsService.createBulkManual(createBulkQuestionsDto);
  }
}
