import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async startExam(userId: string, startExamDto: StartExamDto) {
    const { topicId, limit = 10 } = startExamDto;

    // Verify topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: {
          take: limit,
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.questions.length === 0) {
      throw new BadRequestException('No questions available for this topic');
    }

    const totalMarks = topic.questions.length; // 1 mark per question

    const exam = await this.prisma.exam.create({
      data: {
        userId,
        topicId,
        totalMarks,
        status: 'IN_PROGRESS',
      },
    });

    const formattedQuestions = topic.questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      options: [
        { id: 'A', optionText: q.optionA },
        { id: 'B', optionText: q.optionB },
        { id: 'C', optionText: q.optionC },
        { id: 'D', optionText: q.optionD },
      ],
    }));

    return {
      examId: exam.id,
      topicId,
      questions: formattedQuestions,
    };
  }

  async submitExam(userId: string, submitExamDto: SubmitExamDto) {
    const { examId, answers } = submitExamDto;

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.userId !== userId) {
      throw new BadRequestException('Exam does not belong to the user');
    }

    if (exam.status === 'COMPLETED') {
      throw new BadRequestException('Exam has already been submitted');
    }

    // Process answers and calculate score
    let score = 0;
    const answerDetails: any[] = [];
    const examAnswersToCreate: any[] = [];

    for (const answer of answers) {
      const question = await this.prisma.question.findUnique({
        where: { id: answer.questionId },
      });

      if (!question) continue; // Skip invalid questions

      const isCorrect = question.correctOption === answer.selectedOptionId;
      if (isCorrect) {
        score++;
      }

      answerDetails.push({
        questionId: question.id,
        questionText: question.questionText,
        selectedOptionId: answer.selectedOptionId,
        correctOptionId: question.correctOption,
        isCorrect,
        explanation: question.explanation,
      });

      examAnswersToCreate.push({
        examId: exam.id,
        questionId: question.id,
        selectedOption: answer.selectedOptionId,
        isCorrect,
      });
    }

    // Save exam answers and update exam in a transaction
    await this.prisma.$transaction([
      this.prisma.examAnswer.createMany({
        data: examAnswersToCreate,
      }),
      this.prisma.exam.update({
        where: { id: exam.id },
        data: {
          status: 'COMPLETED',
          score,
        },
      }),
    ]);

    const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;

    return {
      examId: exam.id,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      details: answerDetails,
    };
  }

  async getMyHistory(userId: string) {
    const exams = await this.prisma.exam.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          select: { name: true },
        },
      },
    });

    return exams.map(exam => ({
      id: exam.id,
      topicName: exam.topic.name,
      score: exam.score,
      totalMarks: exam.totalMarks,
      percentage: exam.totalMarks > 0 ? (exam.score / exam.totalMarks) * 100 : 0,
      createdAt: exam.createdAt,
    }));
  }
}
