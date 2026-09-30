import { PartialType } from '@nestjs/mapped-types';
import { CreatePoItemDto } from './create-po-item.dto';
export class UpdatePoItemDto extends PartialType(CreatePoItemDto) {}
