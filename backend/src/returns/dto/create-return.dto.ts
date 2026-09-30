import { IsUUID, IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export const RETURN_STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const;

export class CreateReturnDto {
  @IsUUID()
  sale_id: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'refund_amount must be 0 or greater' })
  refund_amount?: number;

  @IsOptional()
  @IsIn(RETURN_STATUSES, {
    message: `status must be one of: ${RETURN_STATUSES.join(', ')}`,
  })
  status?: string;
}
