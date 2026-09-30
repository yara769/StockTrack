import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Length,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  cat_id: string;

  @IsString()
  @Length(1, 50)
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  @Length(2, 200)
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  unit?: string;
}
