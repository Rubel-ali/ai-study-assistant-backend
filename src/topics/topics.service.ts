import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto) {
    return this.prisma.topic.create({
      data: createTopicDto,
    });
  }

  async findAll() {
    return this.prisma.topic.findMany({
      include: {
        subject: true,
      },
    });
  }

  async findOne(id: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        subject: true,
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }

  async findBySubject(subjectId: string) {
    return this.prisma.topic.findMany({
      where: { subjectId },
      include: {
        subject: true,
      },
    });
  }

  async update(id: string, updateTopicDto: UpdateTopicDto) {
    await this.findOne(id); // Check existence
    
    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    
    return this.prisma.topic.delete({
      where: { id },
    });
  }
}
