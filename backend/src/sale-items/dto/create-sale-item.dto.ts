import { IsUUID, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateSaleItemDto {
  @IsUUID()
  sale_id: string;

  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(1, { message: 'qty must be at least 1' })
  qty: number;

  @IsNumber()
  @Min(0, { message: 'unit_price must be 0 or greater' })
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'total must be 0 or greater' })
  total?: number;
}
