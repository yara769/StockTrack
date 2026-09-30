import { IsUUID, IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed'] as const;

export class CreatePaymentDto {
  @IsUUID()
  sale_id: string;

  @IsOptional()
  @IsIn(PAYMENT_METHODS, {
    message: `method must be one of: ${PAYMENT_METHODS.join(', ')}`,
  })
  method?: string;

  @IsNumber()
  @Min(0, { message: 'amount must be 0 or greater' })
  amount: number;

  @IsOptional()
  @IsIn(PAYMENT_STATUSES, {
    message: `status must be one of: ${PAYMENT_STATUSES.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @IsString()
  ref?: string;

  @IsOptional()
  paid_at?: Date;
}
