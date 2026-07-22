import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: createSubjectDto,
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        subCategory: true,
      },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        subCategory: true,
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async findBySubCategory(subCategoryId: string) {
    return this.prisma.subject.findMany({
      where: { subCategoryId },
      include: {
        subCategory: true,
      },
    });
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    await this.findOne(id); // Check existence
    
    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    
    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
