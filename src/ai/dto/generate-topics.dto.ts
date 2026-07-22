import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateTopicsDto {
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @IsString()
  @IsNotEmpty()
  subCategoryName: string;
}
