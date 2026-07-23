import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('start')
  async startExam(@Req() req, @Body() startExamDto: StartExamDto) {
    const userId = req.user.sub;
    return this.examsService.startExam(userId, startExamDto);
  }

  @Post('submit')
  async submitExam(@Req() req, @Body() submitExamDto: SubmitExamDto) {
    const userId = req.user.sub;
    return this.examsService.submitExam(userId, submitExamDto);
  }

  @Get('my-history')
  async getMyHistory(@Req() req) {
    const userId = req.user.sub;
    return this.examsService.getMyHistory(userId);
  }
}
