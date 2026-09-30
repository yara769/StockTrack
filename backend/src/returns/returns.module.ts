import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Return } from './entities/return.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [TypeOrmModule.forFeature([Return, Sale])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
