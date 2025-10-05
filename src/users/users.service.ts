import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { IPaginationFilter } from 'src/utils/utils.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  async findAUser(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }

      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }
      return {
        data: user,
        success: true,
        code: HttpStatus.OK,
        message: 'User Found',
      };
    } catch (error) {
      throw new BadRequestException('Error: User not found', error.message);
    }
  }

  async findAllUsers(
    id: string,
    filters?: IPaginationFilter,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel.findOne({ _id: id }).exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const searchFilter: any = {};

      if (filters?.search) {
        const searchTerm = filters.search.trim();
        const userFields = Object.keys(this.userModel.schema.obj);

        searchFilter.$or = userFields
          .map((field) => {
            const fieldType = this.userModel.schema.obj[field]?.type;
            if (fieldType === String) {
              return {
                [field]: { $regex: searchTerm, $options: 'i' },
              };
            }
            return {};
          })
          .filter((condition) => Object.keys(condition).length > 0);
      }

      const limit = filters?.limit || 10;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const totalCount = await this.userModel.countDocuments(searchFilter);

      const users = await this.userModel
        .find(searchFilter)
        // .populate([{path: 'added_by'}, {path: 'edited_by'}])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!users || users.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No users found.',
        };
      }

      return {
        data: { totalCount, users },
        success: true,
        code: HttpStatus.OK,
        message: 'Users fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteAUser(id: string, userId: string): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingUser = await this.userModel.findById(userId).exec();

      if (!deletingUser) {
        throw new NotFoundException('User not found');
      }

      await deletingUser.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'User Deleted',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not delete User',
        error.message,
      );
    }
  }
}
