import { IsString, IsNumber, Min, Max } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  topicId: string;

  @IsString()
  topicName: string;

  @IsString()
  subjectName: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  count: number;
}
