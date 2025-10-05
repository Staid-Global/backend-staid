import { forwardRef, Module } from '@nestjs/common';
import { BunkernoteService } from './bunkernote.service';
import { BunkernoteController } from './bunkernote.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bunkernote, BunkernoteSchema } from './entities/bunkernote.entity';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bunkernote.name, schema: BunkernoteSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
  ],
  controllers: [BunkernoteController],
  providers: [BunkernoteService],
  exports: [BunkernoteService],
})
export class BunkernoteModule {}
