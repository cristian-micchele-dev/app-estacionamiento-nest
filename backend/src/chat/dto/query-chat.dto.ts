import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class QueryChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}
