import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCategoriesController, CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
