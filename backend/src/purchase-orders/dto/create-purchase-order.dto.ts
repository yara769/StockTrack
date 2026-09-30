import { IsUUID, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export const PO_STATUSES = ['pending', 'received'] as const;

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplier_id: string;

  @IsUUID()
  store_id: string;

  @IsOptional()
  @IsIn(PO_STATUSES, {
    message: `status must be one of: ${PO_STATUSES.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'total must be 0 or greater' })
  total?: number;

  @IsOptional()
  ordered_at?: Date;

  @IsOptional()
  expected_at?: Date;
}
