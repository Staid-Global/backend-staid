import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseResponseTypeDTO, IPaginationFilter } from 'src/utils/utils.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Bank } from './entities/bank.entity';

@Injectable()
export class BanksService {
  constructor(
    @InjectModel(Bank.name)
    private readonly bankModel: Model<Bank>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    userId: string,
    payload: CreateBankDto,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      const bank = new this.bankModel({
        ...payload,
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await bank.save();

      return {
        data: bank,
        success: true,
        code: HttpStatus.OK,
        message: 'Bank added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException('Error: Can not add a bank', error.message);
    }
  }

  async updateBank(
    userId,
    bankId: string,
    payload: UpdateBankDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bank = await this.bankModel.findById(bankId).exec();

    if (!bank) {
      throw new NotFoundException('bank not found');
    }

    if ('account_name' in payload) {
      bank.account_name = payload.account_name;
    }
    if ('account_number' in payload) {
      bank.account_number = payload.account_number;
    }

    if ('bank_name' in payload) {
      bank.bank_name = payload.bank_name;
    }
    bank.edited_by = user._id.toString();
    await bank.save();
    try {
      return {
        data: bank,
        success: true,
        code: HttpStatus.OK,
        message: 'Bank updated',
      };
    } catch (error) {}
  }

  async findABank(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }
      const bank = await this.bankModel.findById(id).exec();

      if (!bank) {
        throw new NotFoundException('bank not found');
      }
      return {
        data: bank,
        success: true,
        code: HttpStatus.OK,
        message: 'Bank Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllBanks(
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
        const bankFields = Object.keys(this.bankModel.schema.obj);

        searchFilter.$or = bankFields
          .map((field) => {
            const fieldType = this.bankModel.schema.obj[field]?.type;
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

      const totalCount = await this.bankModel.countDocuments(searchFilter);

      const banks = await this.bankModel
        .find(searchFilter)
        .populate([{ path: 'added_by' }, { path: 'edited_by' }])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!banks || banks.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No banks found.',
        };
      }

      return {
        data: { totalCount, banks },
        success: true,
        code: HttpStatus.OK,
        message: 'Banks fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteABank(id: string, bankId: string): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingbank = await this.bankModel.findById(bankId).exec();

      if (!deletingbank) {
        throw new NotFoundException('bank not found');
      }

      await deletingbank.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Bank Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }
}
