import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
        },
      });
      return { success: true, data: category };
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictException('Category with this slug already exists');
      }
      throw error;
    }
  }

  async createSubCategory(dto: CreateSubCategoryDto) {
    try {
      const subCategory = await this.prisma.subCategory.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          categoryId: dto.categoryId,
        },
      });
      return { success: true, data: subCategory };
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new ConflictException('SubCategory with this slug already exists');
      }
      if (error.code === 'P2003') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async updateCategoryStatus(id: string, dto: UpdateStatusDto) {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: { isActive: dto.isActive },
      });
      return { success: true, data: category };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async updateSubCategoryStatus(id: string, dto: UpdateStatusDto) {
    try {
      const subCategory = await this.prisma.subCategory.update({
        where: { id },
        data: { isActive: dto.isActive },
      });
      return { success: true, data: subCategory };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('SubCategory not found');
      }
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      await this.prisma.category.delete({
        where: { id },
      });
      return { success: true, message: 'Category successfully deleted' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async getActiveCategoriesTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          include: {
            _count: {
              select: { subjects: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    return { success: true, data: categories };
  }
}
