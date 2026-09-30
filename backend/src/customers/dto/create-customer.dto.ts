import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'loyalty_points must be 0 or greater' })
  loyalty_points?: number;
}
