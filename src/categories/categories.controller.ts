import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-sub-category.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getActiveCategoriesTree() {
    return this.categoriesService.getActiveCategoriesTree();
  }

  @Get('sub-categories/category/:categoryId')
  getSubCategoriesByCategory(@Param('categoryId') categoryId: string) {
    return this.categoriesService.getSubCategoriesByCategory(categoryId);
  }

  @Post()
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Post('sub-categories')
  createSubCategory(@Body() dto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(dto);
  }

  @Patch(':id/status')
  updateCategoryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.categoriesService.updateCategoryStatus(id, dto);
  }

  @Patch('sub-categories/:id/status')
  updateSubCategoryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.categoriesService.updateSubCategoryStatus(id, dto);
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
