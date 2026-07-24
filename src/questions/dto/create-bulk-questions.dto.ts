import { Type } from 'class-transformer';
import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  Validate, 
  ValidatorConstraint, 
  ValidatorConstraintInterface, 
  ValidationArguments 
} from 'class-validator';

export class QuestionOptionDto {
  @IsString()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

@ValidatorConstraint({ name: 'hasExactlyOneCorrectOption', async: false })
export class HasExactlyOneCorrectOptionConstraint implements ValidatorConstraintInterface {
  validate(options: QuestionOptionDto[], args: ValidationArguments) {
    if (!Array.isArray(options)) return false;
    const correctOptions = options.filter(o => o.isCorrect === true);
    return correctOptions.length === 1;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each question must have exactly one correct option.';
  }
}

export class BulkQuestionDto {
  @IsString()
  questionText: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @Validate(HasExactlyOneCorrectOptionConstraint)
  options: QuestionOptionDto[];
}

export class CreateBulkQuestionsDto {
  @IsString()
  topicId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkQuestionDto)
  questions: BulkQuestionDto[];
}
