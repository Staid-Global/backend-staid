import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateEmaildirectoryDto } from './dto/create-emaildirectory.dto';
import { UpdateEmaildirectoryDto } from './dto/update-emaildirectory.dto';
import { BaseResponseTypeDTO, IPaginationFilter } from 'src/utils/utils.types';
import { InjectModel } from '@nestjs/mongoose';
import { Emaildirectory } from './entities/emaildirectory.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class EmaildirectoryService {
  constructor(
    @InjectModel(Emaildirectory.name)
    private readonly emailModel: Model<Emaildirectory>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    userId: string,
    payload: CreateEmaildirectoryDto,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      const directory = new this.emailModel({
        ...payload,
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await directory.save();

      return {
        data: directory,
        success: true,
        code: HttpStatus.OK,
        message: 'Directory added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a directory',
        error.message,
      );
    }
  }

  async updateDirectory(
    userId,
    directoryId: string,
    payload: UpdateEmaildirectoryDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const directory = await this.emailModel.findById(directoryId).exec();

    if (!directory) {
      throw new NotFoundException('Directory not found');
    }

    if ('company' in payload) {
      directory.company = payload.company;
    }

    if ('company_email' in payload) {
      directory.company_email = payload.company_email;
    }

    if ('phone' in payload) {
      directory.phone = payload.phone;
    }

    if ('officeNumber' in payload) {
      directory.officeNumber = payload.officeNumber;
    }

    if ('name' in payload) {
      directory.name = payload.name;
    }

    directory.edited_by = user._id.toString();
    await directory.save();
    try {
      return {
        data: directory,
        success: true,
        code: HttpStatus.OK,
        message: 'Directory profile updated',
      };
    } catch (error) {}
  }

  async findADirectory(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }
      const directory = await this.emailModel.findById(id).exec();

      if (!directory) {
        throw new NotFoundException('Directory not found');
      }
      return {
        data: directory,
        success: true,
        code: HttpStatus.OK,
        message: 'directory Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllDirectories(
    userId: string,
    filters?: IPaginationFilter & { category?: string },
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }
      const searchFilter: any = {};

      if (filters?.category) {
        searchFilter.category = filters.category;
      }

      if (filters?.search) {
        const searchTerm = filters.search.trim();
        const directoryFields = Object.keys(this.emailModel.schema.obj);

        searchFilter.$or = directoryFields
          .map((field) => {
            const fieldType = this.emailModel.schema.obj[field]?.type;
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

      const totalCount = await this.emailModel.countDocuments(searchFilter);

      const directories = await this.emailModel
        .find(searchFilter)
        .populate([
          { path: 'added_by' },
          { path: 'edited_by' },
          { path: 'company' },
        ])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!directories || directories.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No directories found.',
        };
      }

      return {
        data: { totalCount, directories },
        success: true,
        code: HttpStatus.OK,
        message: 'directories fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteADirectory(
    id: string,
    directoryId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingdirectory = await this.emailModel
        .findById(directoryId)
        .exec();

      if (!deletingdirectory) {
        throw new NotFoundException('directory not found');
      }

      await deletingdirectory.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'directory Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }
}
