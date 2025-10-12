import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { BaseResponseTypeDTO, IPaginationFilter, SendEmailDTOOOOOO } from 'src/utils/utils.types';
import { InjectModel } from '@nestjs/mongoose';
import { Invoice } from './entities/invoice.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import * as PDFDocument from 'pdfkit';
import { Company } from 'src/company/entities/company.entity';
import { MailjetService } from 'src/Email/mailjet';
const baseUrl = 'https://staid-redesigned.vercel.app/view';
// const baseUrl ='https://staidgloballtd.com/view'

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<Invoice>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private mailjetSrv: MailjetService,
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

  async findAInvoiceByHashedId(id: string): Promise<BaseResponseTypeDTO> {
    try {
      const invoice = await this.invoiceModel.findOne({hashed_id: id}).exec();

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
  
  async sendInvoiceEmail(payload) {
    let body = '';
    const invoice = await this.findAInvoiceByHashedId(payload.hashedId)
    const com = await this.companyModel.findById(invoice.data.company);
    if (!com) {
      throw new NotFoundException('Company not found');
    }

    if (invoice.data.category === 'rail-road-track') {
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
            <p>Dear ${com.name},</p>

            <p>${payload.body}</p>

            <p>Kindly click the button below to view your document securely.</p>

            <p style="text-align: center">
              <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
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

    if (invoice.data.category === 'staid-global') {
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
        <p>Dear ${com.name},</p>

        <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
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

    if (invoice.data.category === 'two-ventures') {
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
      <p>Dear ${com.name},</p>

      <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/invoice/${payload.hashedId}" class="btn">View Document</a>
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
        `No email template found for category: ${invoice.data.category}`,
      );
    }
    await this.mailjetSrv.sendMail(body, payload.subject, payload.email);
  }


  async sendInvoiceEmaill(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    await this.sendInvoiceEmail(payload);
    return {
      message: 'Invoice Email Sent',
      success: true,
      code: HttpStatus.OK,
    };
  }


}
