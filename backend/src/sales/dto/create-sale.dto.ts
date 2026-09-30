import { IsUUID, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export const SALE_STATUSES = ['completed', 'refunded', 'void'] as const;

export class CreateSaleDto {
  @IsUUID()
  store_id: string;

  @IsOptional()
  @IsUUID()
  cust_id?: string;

  @IsOptional()
  @IsUUID()
  emp_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'subtotal must be 0 or greater' })
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'tax must be 0 or greater' })
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'discount must be 0 or greater' })
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'total must be 0 or greater' })
  total?: number;

  @IsOptional()
  @IsIn(SALE_STATUSES, {
    message: `status must be one of: ${SALE_STATUSES.join(', ')}`,
  })
  status?: string;
}
