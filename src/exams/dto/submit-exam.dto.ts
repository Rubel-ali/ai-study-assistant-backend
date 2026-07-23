import { IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  selectedOptionId: string;
}

export class SubmitExamDto {
  @IsString()
  @IsNotEmpty()
  examId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ArrayMinSize(1)
  answers: AnswerDto[];
}
