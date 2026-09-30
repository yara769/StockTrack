import { IsString, IsOptional, IsUUID, IsIn, Length } from 'class-validator';

export const EMPLOYEE_ROLES = ['cashier', 'manager', 'admin'] as const;

export class CreateEmployeeDto {
  @IsUUID()
  store_id: string;

  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @Length(5, 100)
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  pin?: string;

  @IsOptional()
  @IsIn(EMPLOYEE_ROLES, {
    message: `role must be one of: ${EMPLOYEE_ROLES.join(', ')}`,
  })
  role?: string;
}
