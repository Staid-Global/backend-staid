import { forwardRef, Module } from '@nestjs/common';
import { EmaildirectoryService } from './emaildirectory.service';
import { EmaildirectoryController } from './emaildirectory.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import {
  Emaildirectory,
  EmaildirectorySchema,
} from './entities/emaildirectory.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Emaildirectory.name, schema: EmaildirectorySchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
  ],

  controllers: [EmaildirectoryController],
  providers: [EmaildirectoryService],
  exports: [EmaildirectoryService],
})
export class EmaildirectoryModule {}
