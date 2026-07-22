import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateSubjectsDto {
  @IsUUID()
  @IsNotEmpty()
  subCategoryId: string;

  @IsString()
  @IsNotEmpty()
  subCategoryName: string;

  @IsString()
  @IsNotEmpty()
  categoryName: string;
}
