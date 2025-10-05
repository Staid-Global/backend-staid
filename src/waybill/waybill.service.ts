import { CreateWaybillDto } from './dto/create-waybill.dto';
import { UpdateWaybillDto } from './dto/update-waybill.dto';
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
import { Waybill } from './entities/waybill.entity';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class WaybillService {
  constructor(
    @InjectModel(Waybill.name)
    private readonly waybillModel: Model<Waybill>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    userId: string,
    payload: CreateWaybillDto,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      async function generateUnique(length = 32): Promise<string> {
        let result = '';
        const characters =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * characters.length),
          );
        }

        return result;
      }

      const hash = await generateUnique();

      const waybill = new this.waybillModel({
        ...payload,
        hashed_id: hash.toLocaleLowerCase(),
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await waybill.save();

      return {
        data: waybill,
        success: true,
        code: HttpStatus.OK,
        message: 'Waybill added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a waybill',
        error.message,
      );
    }
  }

  async updateWaybill(
    userId,
    waybillId: string,
    payload: UpdateWaybillDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const waybill = await this.waybillModel.findById(waybillId).exec();

    if (!waybill) {
      throw new NotFoundException('User not found');
    }

    if ('company' in payload) {
      waybill.company = payload.company;
    }

    if ('items' in payload) {
      waybill.items = payload.items;
    }

    if ('status' in payload) {
      waybill.status = payload.status;
    }

    if ('category' in payload) {
      waybill.category = payload.category;
    }

    waybill.edited_by = user._id.toString();
    await waybill.save();
    try {
      return {
        data: waybill,
        success: true,
        code: HttpStatus.OK,
        message: 'Waybill profile updated',
      };
    } catch (error) {}
  }

  async findAWaybill(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }
      const waybill = await this.waybillModel.findById(id).exec();

      if (!waybill) {
        throw new NotFoundException('waybill not found');
      }
      return {
        data: waybill,
        success: true,
        code: HttpStatus.OK,
        message: 'Waybill Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllWaybills(
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
        const waybillFields = Object.keys(this.waybillModel.schema.obj);

        searchFilter.$or = waybillFields
          .map((field) => {
            const fieldType = this.waybillModel.schema.obj[field]?.type;
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

      const totalCount = await this.waybillModel.countDocuments(searchFilter);

      const waybills = await this.waybillModel
        .find(searchFilter)
        .populate([
          { path: 'added_by' },
          { path: 'edited_by' },
          { path: 'company' },
        ])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!waybills || waybills.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No waybills found.',
        };
      }

      return {
        data: { totalCount, waybills },
        success: true,
        code: HttpStatus.OK,
        message: 'Waybills fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteAWaybill(
    id: string,
    waybillId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingWaybill = await this.waybillModel
        .findById(waybillId)
        .exec();

      if (!deletingWaybill) {
        throw new NotFoundException('Waybill not found');
      }

      await deletingWaybill.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Waybill Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async getDataById(id: string): Promise<any> {
    const data = await this.waybillModel
      .findOne({ hashed_id: id })
      .populate([
        { path: 'added_by' },
        { path: 'edited_by' },
        { path: 'company' },
      ])

      .lean();
    if (!data) {
      throw new NotFoundException(`Waybill not found`);
    }

    ['added_by', 'edited_by'].forEach((field) => {
      if (data[field]) {
        const {
          password,
          __v,
          createdAt,
          updatedAt,
          _id,
          role,
          last_Login,
          email,
          status,
          picture,
          ...safeData
        } = data[field];
        data[field] = safeData;
      }
    });

    ['company'].forEach((field) => {
      if (data[field]) {
        const {
          _id,
          __v,
          createdAt,
          updatedAt,
          added_by,
          edited_by,
          ...safeData
        } = data[field];
        data[field] = safeData;
      }
    });

    return data;
  }

  async generatePdf(data: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // PDF Header
      doc.fontSize(15).text('WAYBILL DOCUMENT', { align: 'center' });
      doc.moveDown();

      Object.entries(data).forEach(([key, value]) => {
        let displayValue: string;

        if (typeof value === 'object') {
          displayValue = JSON.stringify(value, null, 2);
        } else {
          displayValue = String(value);
        }

        doc.fontSize(10).text(`${key}: ${displayValue}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
