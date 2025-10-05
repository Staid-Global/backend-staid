import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { BaseResponseTypeDTO, IPaginationFilter } from 'src/utils/utils.types';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice } from './entities/invoice.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import * as PDFDocument from 'pdfkit';
import * as crypto from 'crypto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<Invoice>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(
    userId: string,
    payload: CreateInvoiceDto,
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

      // const fullHash = crypto.createHash('md5').digest('hex');

      // const lettersOnly = fullHash.replace(/[0-9]/g, '');
      // const hash = lettersOnly.slice(0, 8).padEnd(5, 'x');

      const invoice = new this.invoiceModel({
        ...payload,
        hashed_id: hash.toLocaleLowerCase(),
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await invoice.save();

      return {
        data: invoice,
        success: true,
        code: HttpStatus.OK,
        message: 'Invoice added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a invoice',
        error.message,
      );
    }
  }

  async updateInvoice(
    userId,
    invoiceId: string,
    payload: UpdateInvoiceDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invoice = await this.invoiceModel.findById(invoiceId).exec();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if ('company' in payload) {
      invoice.company = payload.company;
    }
    if ('category' in payload) {
      invoice.category = payload.category;
    }

    if ('items' in payload) {
      invoice.items = payload.items;
    }

    if ('status' in payload) {
      invoice.status = payload.status;
    }

    if ('handling_charge' in payload) {
      invoice.handling_charge = payload.handling_charge;
    }

    if ('vat' in payload) {
      invoice.vat = payload.vat;
    }

    invoice.edited_by = user._id.toString();
    await invoice.save();
    try {
      return {
        data: invoice,
        success: true,
        code: HttpStatus.OK,
        message: 'Invoice updated',
      };
    } catch (error) {}
  }

  async findAInvoice(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }

      const invoice = await this.invoiceModel.findById(id).exec();

      if (!invoice) {
        throw new NotFoundException('invoice not found');
      }
      return {
        data: invoice,
        success: true,
        code: HttpStatus.OK,
        message: 'Invoice Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllInvoices(
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
        const invoiceFields = Object.keys(this.invoiceModel.schema.obj);

        searchFilter.$or = invoiceFields
          .map((field) => {
            const fieldType = this.invoiceModel.schema.obj[field]?.type;
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

      const totalCount = await this.invoiceModel.countDocuments(searchFilter);

      const invoices = await this.invoiceModel
        .find(searchFilter)
        .populate([
          { path: 'added_by' },
          { path: 'edited_by' },
          { path: 'company' },
        ])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!invoices || invoices.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No invoices found.',
        };
      }

      return {
        data: { totalCount, invoices },
        success: true,
        code: HttpStatus.OK,
        message: 'Invoices fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteAnInvoice(
    id: string,
    invoiceId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingInvoice = await this.invoiceModel
        .findById(invoiceId)
        .exec();

      if (!deletingInvoice) {
        throw new NotFoundException('Invoice not found');
      }

      await deletingInvoice.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Invoice Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async getDataById(id: string): Promise<any> {
    const data = await this.invoiceModel
      .findOne({ hashed_id: id })
      .populate([
        { path: 'added_by' },
        { path: 'edited_by' },
        { path: 'company' },
      ])

      .lean();
    if (!data) {
      throw new NotFoundException(`Invoice not found`);
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
      doc.fontSize(15).text('INVOICE DOCUMENT', { align: 'center' });
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
