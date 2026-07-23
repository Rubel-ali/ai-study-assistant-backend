import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class StartExamDto {
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
