import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company } from './entities/company.entity';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { IPaginationFilter } from 'src/utils/utils.types';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    userId: string,
    payload: CreateCompanyDto,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      const emailExist = await this.companyModel.findOne({
        email: payload.email,
      });

      if (emailExist) {
        throw new ConflictException('Company email already exists');
      }

      const company = new this.companyModel({
        ...payload,
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await company.save();

      return {
        data: company,
        success: true,
        code: HttpStatus.OK,
        message: 'Company added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a company',
        error.message,
      );
    }
  }

  async updateCompany(
    userId,
    companyId: string,
    payload: UpdateCompanyDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const company = await this.companyModel.findById(companyId).exec();

    if (!company) {
      throw new NotFoundException('User not found');
    }

    if ('name' in payload) {
      company.name = payload.name;
    }

    if ('phone' in payload) {
      company.phone = payload.phone;
    }

    if ('address' in payload) {
      company.address = payload.address;
    }

    if ('status' in payload) {
      company.status = payload.status;
    }

    if ('email' in payload) {
      const emailExist = await this.companyModel
        .findOne({ email: payload.email })
        .exec();
      if (emailExist && !company.email) {
        throw new ConflictException('Email already exist');
      }
      company.email = payload.email;
    }
    company.edited_by = user._id.toString();
    await company.save();
    try {
      return {
        data: company,
        success: true,
        code: HttpStatus.OK,
        message: 'Company profile updated',
      };
    } catch (error) {}
  }

  async findACompany(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }

      const company = await this.companyModel.findById(id).exec();

      if (!company) {
        throw new NotFoundException('Company not found');
      }
      return {
        data: company,
        success: true,
        code: HttpStatus.OK,
        message: 'Company Found',
      };
    } catch (error) {
      throw new BadRequestException('Error: Company not found', error.message);
    }
  }

  async findAllCompany(
    userId: string,
    filters?: IPaginationFilter,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }

      const searchFilter: any = {};

      if (filters?.search) {
        const searchTerm = filters.search.trim();
        const companyFields = Object.keys(this.companyModel.schema.obj);

        searchFilter.$or = companyFields
          .map((field) => {
            const fieldType = this.companyModel.schema.obj[field]?.type;
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

      const totalCount = await this.companyModel.countDocuments(searchFilter);

      const companies = await this.companyModel
        .find(searchFilter)
        .populate([{ path: 'added_by' }, { path: 'edited_by' }])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!companies || companies.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No companies found.',
        };
      }

      return {
        data: { totalCount, companies },
        success: true,
        code: HttpStatus.OK,
        message: 'Companies fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteACompany(
    id: string,
    companyId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingCompany = await this.companyModel
        .findById(companyId)
        .exec();

      if (!deletingCompany) {
        throw new NotFoundException('Company not found');
      }

      await deletingCompany.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Company Deleted',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not delete company',
        error.message,
      );
    }
  }
}
