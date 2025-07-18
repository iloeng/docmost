import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DeletePageDto {
  @IsString()
  pageId: string;

  @IsOptional()
  @IsBoolean()
  forceDelete?: boolean;
}