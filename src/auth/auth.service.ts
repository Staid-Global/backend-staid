import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BaseResponseTypeDTO,
  changePasswordDTO,
  loginDTO,
  registerDTO,
  updateProfileDto,
} from './dto/create-auth.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { SendEmailDTO, SendEmailDTOOOOOO } from 'src/utils/utils.types';
import { sendEmail } from 'src/Email/emailsmpt';
import { MailjetService } from 'src/Email/mailjet';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
    private mailjetSrv: MailjetService,
  ) {}

  async create(
    userId: string,
    payload: registerDTO,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({
        _id: userId,
        role: 'ADMIN',
      });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      const emailExist = await this.userModel.findOne({ email: payload.email });
      if (emailExist) {
        throw new ConflictException('Email already exist');
      }

      const Password = 'Password123';
      const hashedPassword = await bcrypt.hash(Password, 10);
      const user = new this.userModel({
        fullname: payload.fullname,
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        status: payload.status,
      });
      await user.save();

      return {
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'User registered sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not register a user',
        error.message,
      );
    }
  }

  async changePassword(
    userId: string,
    payload: changePasswordDTO,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Compare old password with the current one
      const isMatch = await bcrypt.compare(
        payload.currentPassword,
        user.password,
      );
      if (!isMatch) {
        return {
          success: false,
          code: HttpStatus.BAD_REQUEST,
          message: 'Old password is incorrect',
        };
      }

      const isSameAsOld = await bcrypt.compare(
        payload.newPassword,
        user.password,
      );
      if (isSameAsOld) {
        return {
          success: false,
          code: HttpStatus.BAD_REQUEST,
          message: 'New password cannot be the same as the old password',
        };
      }

      const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

      user.password = hashedPassword;
      await user.save();

      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Password updated successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Password change failed',
        error.message,
      );
    }
  }

  async login(payload: loginDTO): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ email: payload.email })
        .exec();
      const isMatch = await bcrypt.compare(payload.password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException('Incorrect email or password');
      }

      user.last_Login = new Date();
      await user.save();
      const id = user._id ? user._id.toString() : user.id;

      const sub = { email: user.email, sub: id };

      const accessToken = this.jwtService.sign(sub);
      const decoded: any = this.jwtService.decode(accessToken);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000).toISOString()
        : null;

      return {
        data: {
          access_token: accessToken,
          expires_at: expiresAt,
          accessToken_duration: process.env.JWT_EXPIRATION,
          user,
        },
        success: true,
        code: HttpStatus.OK,
        message: 'User login successfully',
      };
    } catch (error) {
      throw new BadRequestException('Error: Can not login', error.message);
    }
  }

  async updateProfile(
    userId,
    payload: updateProfileDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ('fullname' in payload) {
      user.fullname = payload.fullname;
    }

    if ('picture' in payload) {
      user.picture = payload.picture;
    }

    if ('status' in payload) {
      user.status = payload.status;
    }

    if ('email' in payload) {
      const emailExist = await this.userModel
        .findOne({ email: payload.email })
        .exec();
      if (emailExist && !user.email) {
        throw new ConflictException('Email already exist');
      }
      user.email = payload.email;
    }

    await user.save();
    try {
      return {
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'User profile updated',
      };
    } catch (error) {}
  }
  async updateAUserProfile(
    adminId,
    userId,
    payload: updateProfileDto,
  ): Promise<BaseResponseTypeDTO> {
    const admin = await this.userModel
      .findOne({ _id: adminId, role: 'ADMIN' })
      .exec();
    if (!admin) {
      throw new UnauthorizedException('Not authorized');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if ('fullname' in payload) {
      user.fullname = payload.fullname;
    }

    if ('picture' in payload) {
      user.picture = payload.picture;
    }

    if ('status' in payload) {
      user.status = payload.status;
    }

    if ('role' in payload) {
      user.role = payload.role;
    }

    if ('email' in payload) {
      const emailExist = await this.userModel
        .findOne({ email: payload.email })
        .exec();
      if (emailExist && !user.email) {
        throw new ConflictException('Email already exist');
      }
      user.email = payload.email;
    }

    await user.save();
    try {
      return {
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'User profile updated',
      };
    } catch (error) {}
  }

  async sendAnyEmail(payload: SendEmailDTO): Promise<BaseResponseTypeDTO> {
    const body = `${payload.body}`;
    await this.mailjetSrv.sendMail(body, payload.subject, [payload.email]);
    // await sendEmail(body, payload.subject, payload.email);

    return {
      message: 'Message Sent',
      success: true,
      code: HttpStatus.OK,
    };
  }

  
}
