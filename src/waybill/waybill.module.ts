import { forwardRef, Module } from '@nestjs/common';
import { WaybillService } from './waybill.service';
import { WaybillController } from './waybill.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Waybill, WaybillSchema } from './entities/waybill.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema}]),
    forwardRef(() => UsersModule),
  ],
  controllers: [WaybillController],
  providers: [WaybillService],
  exports: [WaybillService],
})
export class WaybillModule {}
