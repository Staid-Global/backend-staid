import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { Quotation } from './entities/quotation.entity';
import { IPaginationFilter } from 'src/utils/utils.types';
import * as PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class QuotationService {
  constructor(
    @InjectModel(Quotation.name)
    private readonly quotationModel: Model<Quotation>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getDataById(id: string): Promise<any> {
    const data = await this.quotationModel
      .findOne({ hashed_id: id })
      .populate([
        { path: 'added_by' },
        { path: 'edited_by' },
        { path: 'company' },
      ])

      .lean();
    if (!data) {
      throw new NotFoundException(`Quotation not found`);
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
      doc.fontSize(15).text('QUOTATION DOCUMENT', { align: 'center' });
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

  async create(
    userId: string,
    payload: CreateQuotationDto,
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

      const quotation = new this.quotationModel({
        ...payload,
        hashed_id: hash.toLocaleLowerCase(),
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await quotation.save();

      return {
        data: quotation,
        success: true,
        code: HttpStatus.OK,
        message: 'Quotation added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a quotation',
        error.message,
      );
    }
  }

  async updateQuotation(
    userId,
    quotationId: string,
    payload: UpdateQuotationDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const quotation = await this.quotationModel.findById(quotationId).exec();

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    if ('company' in payload) {
      quotation.company = payload.company;
    }

    if ('subject' in payload) {
      quotation.subject = payload.subject;
    }

    if ('body' in payload) {
      quotation.body = payload.body;
    }

    if ('category' in payload) {
      quotation.category = payload.category;
    }

    if ('notes' in payload) {
      quotation.notes = payload.notes;
    }

    if ('items' in payload) {
      quotation.items = payload.items;
    }

    if ('status' in payload) {
      quotation.status = payload.status;
    }

    if ('handling_charge' in payload) {
      quotation.handling_charge = payload.handling_charge;
    }

    quotation.edited_by = user._id.toString();
    await quotation.save();
    try {
      return {
        data: quotation,
        success: true,
        code: HttpStatus.OK,
        message: 'Quotation profile updated',
      };
    } catch (error) {}
  }

  async findAQuotation(
    userId: string,
    id: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }

      const quotation = await this.quotationModel.findById(id).exec();

      if (!quotation) {
        throw new NotFoundException('quotation not found');
      }
      return {
        data: quotation,
        success: true,
        code: HttpStatus.OK,
        message: 'Quotation Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllQuotations(
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
        const quotationFields = Object.keys(this.quotationModel.schema.obj);

        searchFilter.$or = quotationFields
          .map((field) => {
            const fieldType = this.quotationModel.schema.obj[field]?.type;
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

      const totalCount = await this.quotationModel.countDocuments(searchFilter);

      const quotations = await this.quotationModel
        .find(searchFilter)
        .populate([
          { path: 'added_by' },
          { path: 'edited_by' },
          { path: 'company' },
        ])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!quotations || quotations.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No quotations found.',
        };
      }

      return {
        data: { totalCount, quotations },
        success: true,
        code: HttpStatus.OK,
        message: 'Quotations fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteAQuotation(
    id: string,
    quotationId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingQuotation = await this.quotationModel
        .findById(quotationId)
        .exec();

      if (!deletingQuotation) {
        throw new NotFoundException('Quotation not found');
      }

      await deletingQuotation.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Quotation Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }
}
