import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoItem } from './entities/po-item.entity';
import { PoItemsController } from './po-items.controller';
import { PoItemsService } from './po-items.service';

@Module({
  imports: [TypeOrmModule.forFeature([PoItem])],
  controllers: [PoItemsController],
  providers: [PoItemsService],
})
export class PoItemsModule {}
