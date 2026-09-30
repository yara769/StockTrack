import { IsString, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
