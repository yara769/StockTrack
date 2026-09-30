import { IsUUID, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePoItemDto {
  @IsUUID()
  po_id: string;

  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(1, { message: 'qty must be at least 1' })
  qty: number;

  @IsNumber()
  @Min(0, { message: 'unit_cost must be 0 or greater' })
  unit_cost: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'received_qty must be 0 or greater' })
  received_qty?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'total must be 0 or greater' })
  total?: number;
}
