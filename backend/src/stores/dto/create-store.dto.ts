import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';
export class CreateStoreDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(1, 50)
  code: string;
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
