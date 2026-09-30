import { IsUUID, IsInt, IsOptional, Min, IsString } from 'class-validator';

export class CreateInventoryDto {
  @IsUUID()
  store_id: string;

  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'quantity must be 0 or greater' })
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'min_stock must be 0 or greater' })
  min_stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'max_stock must be 0 or greater' })
  max_stock?: number;

  @IsOptional()
  @IsString()
  location?: string;
}
