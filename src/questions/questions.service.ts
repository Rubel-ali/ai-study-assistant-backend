import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBulkQuestionsDto } from './dto/create-bulk-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulkManual(dto: CreateBulkQuestionsDto) {
    const { topicId, questions } = dto;

    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    const createdQuestions = await this.prisma.$transaction(
      questions.map((q) => {
        const optionA = q.options[0].optionText;
        const optionB = q.options[1].optionText;
        const optionC = q.options[2].optionText;
        const optionD = q.options[3].optionText;

        let correctOption = 'A';
        if (q.options[1].isCorrect) correctOption = 'B';
        else if (q.options[2].isCorrect) correctOption = 'C';
        else if (q.options[3].isCorrect) correctOption = 'D';

        return this.prisma.question.create({
          data: {
            questionText: q.questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
            explanation: q.explanation,
            tag: q.tag,
            topicId,
          },
        });
      }),
    );

    return {
      success: true,
      count: createdQuestions.length,
      message: `Successfully imported ${createdQuestions.length} questions`,
    };
  }
}
