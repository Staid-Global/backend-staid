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
import { IPaginationFilter, SendEmailDTOOOOOO } from 'src/utils/utils.types';
import * as PDFDocument from 'pdfkit';
import { MailjetService } from 'src/Email/mailjet';
import { Company } from 'src/company/entities/company.entity';

const baseUrl = 'https://staid-redesigned.vercel.app/view';
// const baseUrl ='https://staidgloballtd.com/view'
@Injectable()
export class QuotationService {
  constructor(
    @InjectModel(Quotation.name)
    private readonly quotationModel: Model<Quotation>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private mailjetSrv: MailjetService,
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

  async findAQuotationByHashedId(id: string): Promise<BaseResponseTypeDTO> {
    try {
      const quotation = await this.quotationModel
        .findOne({ hashed_id: id })
        .exec();

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

  async sendQuotationEmail(payload) {
    let body = ``;

    const quotation = await this.findAQuotationByHashedId(payload.hashedId);
    const comp = await this.companyModel.findById(quotation.data.company);
    if (!comp) {
      throw new NotFoundException('Company not found');
    }

    if (quotation.data.category === 'rail-road-track') {
      body = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Staid Email Template</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f6f8fb;
            margin: 0;
            padding: 0;
          }
          .container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 40px auto;
            border-radius: 10px;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .logo {
            font-weight: bold;
            font-size: 1.5rem;
          }
          .header {
            background-color: #251a66;
            color: #ffffff;
            text-align: center;
            padding: 10px;
          }
          .content {
            padding: 25px;
            color: #333333;
            line-height: 1.6;
          }
          .btn {
            display: inline-block;
            background-color: #251a66;
            color: #ffffff !important;
            padding: 10px 15px;
            border-radius: 0.75rem;
            text-decoration: none;
            font-weight: 400;
            margin-top: 15px;
          }

          .footer {
            background-color: #f1f1f1;
            text-align: center;
            font-size: 13px;
            color: #555555;
            padding: 15px 10px;
          }
          .footer a {
            color: #251a66;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="logo">Rail-Road Track</h2>
            <p>Track Logistics</p>
          </div>

          <div class="content">
            <p>Dear ${comp.name},</p>

            <p>${payload.body}</p>

            <p>Kindly click the button below to view your document securely.</p>

            <p style="text-align: center">
              <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
            </p>

            <br />
            <br />
            <p>Best regards,</p>
            <p>
              <strong>Oluwole Olaleye</strong><br />
              CEO, Rail Raod Track<br />
              General Suppliers of Petroleum Products<br />
              <a href="mailto:https://staidgloballtd.com"
                >support@railroadtrack.com</a
              >
              08181044690, 08034743098
            </p>
          </div>

          <div class="footer">
            <p>
              Rail-Road Track © 2025 |
              <a href="https://staidgloballtd.com">Visit our website</a>
            </p>
          </div>
        </div>
      </body>
    </html>
    s
    `;
    }

    if (quotation.data.category === 'staid-global') {
      body = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Staid Email Template</title>
        <style>
        body {
        font-family: Arial, sans-serif;
        background-color: #f6f8fb;
        margin: 0;
        padding: 0;
        }
        .container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        border-radius: 10px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        }
        .logo {
        font-weight: bold;
        font-size: 1.5rem;
        }
        .header {
        background-color: #e66d0a;
        color: #ffffff;
        text-align: center;
        padding: 10px;
        }
        .content {
        padding: 25px;
        color: #333333;
        line-height: 1.6;
        }
        .btn {
        display: inline-block;
        background-color: #e66d0a;
        color: #ffffff !important;
        padding: 10px 15px;
        border-radius: 0.75rem;
        text-decoration: none;
        font-weight: 400;
        margin-top: 15px;
        }
        .footer {
        background-color: #f1f1f1;
        text-align: center;
        font-size: 13px;
        color: #555555;
        padding: 15px 10px;
        }
        .footer a {
        color: #e66d0a;
        text-decoration: none;
        }
        </style>
        </head>
        <body>
        <div class="container">
        <div class="header">
        <h2 class="logo">Staid Global Limited</h2>
        <p>EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS</p>
        </div>

        <div class="content">
        <p>Dear ${comp.name},</p>

        <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
        </p>

        <br />
        <br />
        <p>Best regards,</p>
        <p>
          <strong>Oluwole Olaleye</strong><br />
          CEO, Staid Global Limited<br />
          EQUIPMENTS | LOGISTICS | GENERAL MERCHANTS<br />
          <a href="mailto:https://staidgloballtd.com"
            >support@staidgloballtd.com</a
          >
          08181044690, 08034743098
        </p>
        </div>

        <div class="footer">
        <p>
          Staid Global Limited © 2025 |
          <a href="https://staidgloballtd.com">Visit our website</a>
        </p>
        </div>
        </div>
        </body>
        </html>
        s

        `;
    }

    if (quotation.data.category === 'two-ventures') {
      body = `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Staid Email Template</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f6f8fb;
        margin: 0;
        padding: 0;
      }
      .container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        border-radius: 10px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .logo {
        font-weight: bold;
        font-size: 2rem;
      }
      .header {
        background-color: #a21c1c;
        color: #ffffff;
        text-align: center;
        padding: 10px;
      }
      .content {
        padding: 25px;
        color: #333333;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        background-color: #a21c1c;
        color: #ffffff !important;
        padding: 10px 15px;
        border-radius: 0.75rem;
        text-decoration: none;
        font-weight: 400;
        margin-top: 15px;
      }

      .footer {
        background-color: #f1f1f1;
        text-align: center;
        font-size: 13px;
        color: #555555;
        padding: 15px 10px;
      }
      .footer a {
        color: #a21c1c;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2 class="logo">T.W.O Ventures</h2>
        <p>General Suppliers of Petroleum Products</p>
      </div>

      <div class="content">
      <p>Dear ${comp.name},</p>

      <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/quotation/${payload.hashedId}" class="btn">View Document</a>
        </p>

        <br />
        <br />
        <p>Best regards,</p>
        <p>
          <strong>Oluwole Olaleye</strong><br />
          CEO, 2ventures<br />
          General Suppliers of Petroleum Products<br />
          <a href="mailto:https://2ventures.com">support@2ventures.com</a>
          08181044690, 08034743098
        </p>
      </div>

      <div class="footer">
        <p>
          T.W.O Ventures © 2025 |
          <a href="https://2ventures.com">Visit our website</a>
        </p>
      </div>
    </div>
  </body>
</html>
s

    `;
    }

    // ✅ ensure non-empty
    if (!body.trim()) {
      throw new Error(
        `No email template found for category: ${quotation.data.category}`,
      );
    }
    await this.mailjetSrv.sendMail(body, payload.subject, payload.email);
  }

  async sendQuotationEmaill(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    await this.sendQuotationEmail(payload);
    return {
      message: 'Quotation Email Sent',
      success: true,
      code: HttpStatus.OK,
    };
  }
}
