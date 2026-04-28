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
import { readFile } from 'fs/promises';
import { join } from 'path';
import { launchPuppeteerBrowser } from 'src/utils/puppeteer.util';
const baseUrl = process.env.BASE_URL + '/view';
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
    if (data?.category === 'rail-road-track') {
      return this.generateRailRoadInvoicePdf(data);
    }
    if (data?.category === 'staid-global') {
      return this.generateStaidGlobalInvoicePdf(data);
    }
    if (data?.category === 'two-ventures') {
      return this.generateTwoVenturesInvoicePdf(data);
    }

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
  
  private async buildInvoiceEmailHtml(payload: SendEmailDTOOOOOO): Promise<string> {
    let body = '';
    const invoice = await this.findAInvoiceByHashedId(payload.hashedId);
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

            <p>Please find attached the invoice document.</p>

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

        <p>Please find attached the invoice document.</p>

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

        <p>Please find attached the invoice document.</p>

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
    return body;
  }

  async sendInvoiceEmail(payload: SendEmailDTOOOOOO): Promise<void> {
    const body = await this.buildInvoiceEmailHtml(payload);
    await this.mailjetSrv.sendMail(body, payload.subject, payload.email);
  }

  async sendInvoiceEmailWithPdfAttachment(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    const body = await this.buildInvoiceEmailHtml(payload);
    const invoiceData = await this.getDataById(payload.hashedId);
    const pdfBuffer = await this.generatePdf(invoiceData);

    await this.mailjetSrv.sendMail(body, payload.subject, payload.email, [
      {
        ContentType: 'application/pdf',
        Filename: `invoice-${invoiceData.lpo}.pdf`,
        Base64Content: pdfBuffer.toString('base64'),
      },
    ]);

    return {
      message: 'Invoice Email Sent with PDF Attachment',
      success: true,
      code: HttpStatus.OK,
    };
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

  async generateInvoicePdf(data: any): Promise<Buffer> {
    if (data?.category === 'rail-road-track') {
      return this.generateRailRoadInvoicePdf(data);
    }
    if (data?.category === 'staid-global') {
      return this.generateStaidGlobalInvoicePdf(data);
    }
    if (data?.category === 'two-ventures') {
      return this.generateTwoVenturesInvoicePdf(data);
    }

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

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  private formatCurrencyWithSymbol(value: number): string {
    return `₦${this.formatCurrency(value)}`;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(/[^0-9.-]/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private roundToTwo(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private formatAmountWords(value: number): string {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) {
      return 'zero naira';
    }

    const integerAmount = Math.floor(amount);
    if (integerAmount === 0) {
      return 'zero naira';
    }

    const units = [
      '',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
      'ten',
      'eleven',
      'twelve',
      'thirteen',
      'fourteen',
      'fifteen',
      'sixteen',
      'seventeen',
      'eighteen',
      'nineteen',
    ];
    const tens = [
      '',
      '',
      'twenty',
      'thirty',
      'forty',
      'fifty',
      'sixty',
      'seventy',
      'eighty',
      'ninety',
    ];
    const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

    const chunkToWords = (num: number): string => {
      if (num === 0) {
        return '';
      }
      if (num < 20) {
        return units[num];
      }
      if (num < 100) {
        const ten = Math.floor(num / 10);
        const rem = num % 10;
        return rem ? `${tens[ten]}-${units[rem]}` : tens[ten];
      }
      const hundred = Math.floor(num / 100);
      const rem = num % 100;
      return rem
        ? `${units[hundred]} hundred and ${chunkToWords(rem)}`
        : `${units[hundred]} hundred`;
    };

    let remaining = integerAmount;
    let scaleIndex = 0;
    const parts: string[] = [];

    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk > 0) {
        const chunkWord = chunkToWords(chunk);
        const scale = scales[scaleIndex];
        parts.unshift(scale ? `${chunkWord} ${scale}` : chunkWord);
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex += 1;
    }

    return `${parts.join(', ').trim()} naira only`;
  }

  private buildRailRoadRows(
    items: any[] = [],
    handlingCharge = 0,
    vat = 0,
  ): string {
    if (!Array.isArray(items) || items.length === 0) {
      return `
        <tr>
          <td class="data-cell sn">1</td>
          <td class="data-cell">-</td>
          <td class="data-cell description-cell">No invoice items</td>
          <td class="data-cell">${this.formatCurrencyWithSymbol(0)}</td>
          <td class="data-cell">${this.formatCurrencyWithSymbol(0)}</td>
        </tr>
      `;
    }

    const itemRows = items
      .map((item, index) => {
        const quantity = this.toNumber(item?.quantity);
        const rate = this.toNumber(item?.rate);
        const total = this.toNumber(item?.total) || quantity * rate;
        const description = String(item?.description || '-');

        return `
          <tr>
            <td class="data-cell sn">${index + 1}</td>
            <td class="data-cell">${quantity}</td>
            <td class="data-cell description-cell">${description}</td>
            <td class="data-cell">${this.formatCurrencyWithSymbol(rate)}</td>
            <td class="data-cell">${this.formatCurrencyWithSymbol(total)}</td>
          </tr>
          <tr class="spacer"><td colspan="5"></td></tr>
        `;
      })
      .join('');

    const extraRows = `
      <tr>
        <td class="data-cell sn">${items.length + 1}</td>
        <td class="data-cell">-</td>
        <td class="data-cell description-cell">Handling Charge</td>
        <td class="data-cell">${this.formatCurrencyWithSymbol(handlingCharge)}</td>
        <td class="data-cell">${this.formatCurrencyWithSymbol(handlingCharge)}</td>
      </tr>
      <tr class="spacer"><td colspan="5"></td></tr>
      <tr>
        <td class="data-cell sn">${items.length + 2}</td>
        <td class="data-cell">-</td>
        <td class="data-cell description-cell">VAT (7.5%)</td>
        <td class="data-cell">${this.formatCurrencyWithSymbol(vat)}</td>
        <td class="data-cell">${this.formatCurrencyWithSymbol(vat)}</td>
      </tr>
      <tr class="spacer"><td colspan="5"></td></tr>
    `;

    return `${itemRows}${extraRows}`;
  }

  private buildStaidGlobalRows(
    items: any[] = [],
    handlingCharge = 0,
    vat = 0,
  ): string {
    if (!Array.isArray(items) || items.length === 0) {
      return `
        <tr>
          <td>1</td>
          <td class="description">No invoice items</td>
          <td>${this.formatCurrency(0)}</td>
          <td>${this.formatCurrency(0)}</td>
        </tr>
      `;
    }

    const itemRows = items
      .map((item, index) => {
        const quantity = this.toNumber(item?.quantity);
        const rate = this.toNumber(item?.rate);
        const total = this.toNumber(item?.total) || quantity * rate;
        const baseDescription = String(item?.description || '-');
        const description =
          quantity > 0 ? `${baseDescription} (x${quantity})` : baseDescription;

        return `
          <tr>
            <td>${index + 1}</td>
            <td class="description">${description}</td>
            <td>${this.formatCurrency(rate)}</td>
            <td>${this.formatCurrency(total)}</td>
          </tr>
        `;
      })
      .join('');

    const extraRows = `
      <tr>
        <td>${items.length + 1}</td>
        <td class="description">Handling Charge</td>
        <td>${this.formatCurrency(handlingCharge)}</td>
        <td>${this.formatCurrency(handlingCharge)}</td>
      </tr>
      <tr>
        <td>${items.length + 2}</td>
        <td class="description">VAT (7.5%)</td>
        <td>${this.formatCurrency(vat)}</td>
        <td>${this.formatCurrency(vat)}</td>
      </tr>
    `;

    return `${itemRows}${extraRows}`;
  }

  private getRailRoadTemplateData(invoice: any) {
    const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date();
    const day = `${createdAt.getDate()}`.padStart(2, '0');
    const month = createdAt
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase();
    const year = `${createdAt.getFullYear()}`;
    const itemTotal = Array.isArray(invoice?.items)
      ? invoice.items.reduce(
          (sum, item) =>
            sum +
            (this.toNumber(item?.total) ||
              this.toNumber(item?.quantity) * this.toNumber(item?.rate)),
          0,
        )
      : 0;
    const handlingCharge = this.toNumber(invoice?.handling_charge);
    const subtotalBeforeVat = this.roundToTwo(itemTotal + handlingCharge);
    const vat = this.roundToTwo(subtotalBeforeVat * 0.075);
    const grandTotal = this.roundToTwo(subtotalBeforeVat + vat);
    const rowsHtml = this.buildRailRoadRows(
      invoice?.items || [],
      handlingCharge,
      vat,
    );

    return {
      TO_NAME: invoice?.company?.name || 'Customer',
      TO_ADDRESS: invoice?.company?.address || '-',
      DATE_DAY: day,
      DATE_MONTH: month,
      DATE_YEAR: year,
      ROWS_HTML: rowsHtml,
      BANK_NAME: process.env.RAIL_ROAD_BANK_NAME,
      ACCOUNT_NAME: process.env.RAIL_ROAD_ACCOUNT_NAME,
      ACCOUNT_NUMBER: process.env.RAIL_ROAD_ACCOUNT_NUMBER,
      TOTAL_VALUE: this.formatCurrency(grandTotal),
      AMOUNT_IN_WORDS: this.formatAmountWords(grandTotal).toUpperCase(),
    };
  }

  private getStaidGlobalTemplateData(invoice: any) {
    const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date();
    const invoiceDate = createdAt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const itemTotal = Array.isArray(invoice?.items)
      ? invoice.items.reduce(
          (sum, item) =>
            sum +
            (this.toNumber(item?.total) ||
              this.toNumber(item?.quantity) * this.toNumber(item?.rate)),
          0,
        )
      : 0;
    const handlingCharge = this.toNumber(invoice?.handling_charge);
    const subtotalBeforeVat = this.roundToTwo(itemTotal + handlingCharge);
    const vat = this.roundToTwo(subtotalBeforeVat * 0.075);
    const grandTotal = this.roundToTwo(subtotalBeforeVat + vat);
    const rowsHtml = this.buildStaidGlobalRows(
      invoice?.items || [],
      handlingCharge,
      vat,
    );

    return {
      TO_NAME: invoice?.company?.name || 'Customer',
      TO_ADDRESS: invoice?.company?.address || '-',
      INVOICE_NO: invoice?.invoice_id || '-',
      INVOICE_DATE: invoiceDate.toUpperCase(),
      LPO_NO: invoice?.lpo || '-',
      ROWS_HTML: rowsHtml,
      TOTAL_VALUE: this.formatCurrency(grandTotal),
      BANK_NAME: process.env.STAID_GLOBAL_BANK_NAME,
      ACCOUNT_NAME: process.env.STAID_GLOBAL_ACCOUNT_NAME,
      ACCOUNT_NUMBER: process.env.STAID_GLOBAL_ACCOUNT_NUMBER,
    };
  }

  private getTwoVenturesTemplateData(invoice: any) {
    const createdAt = invoice?.createdAt ? new Date(invoice.createdAt) : new Date();
    const invoiceDate = createdAt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const itemTotal = Array.isArray(invoice?.items)
      ? invoice.items.reduce(
          (sum, item) =>
            sum +
            (this.toNumber(item?.total) ||
              this.toNumber(item?.quantity) * this.toNumber(item?.rate)),
          0,
        )
      : 0;
    const handlingCharge = this.toNumber(invoice?.handling_charge);
    const subtotalBeforeVat = this.roundToTwo(itemTotal + handlingCharge);
    const vat = this.roundToTwo(subtotalBeforeVat * 0.075);
    const grandTotal = this.roundToTwo(subtotalBeforeVat + vat);
    const rowsHtml = this.buildStaidGlobalRows(
      invoice?.items || [],
      handlingCharge,
      vat,
    );

    return {
      TO_NAME: invoice?.company?.name || 'Customer',
      TO_ADDRESS: invoice?.company?.address || '-',
      INVOICE_NO: invoice?.invoice_id || '-',
      INVOICE_DATE: invoiceDate.toUpperCase(),
      LPO_NO: invoice?.lpo || '-',
      ROWS_HTML: rowsHtml,
      TOTAL_VALUE: this.formatCurrency(grandTotal),
      BANK_NAME: process.env.TWO_VENTURES_BANK_NAME,
      ACCOUNT_NAME: process.env.TWO_VENTURES_ACCOUNT_NAME,
      ACCOUNT_NUMBER: process.env.TWO_VENTURES_ACCOUNT_NUMBER,
    };
  }

  private getMimeTypeForImage(fileName: string): string {
    const normalized = fileName.toLowerCase();
    if (normalized.endsWith('.png')) {
      return 'image/png';
    }
    if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (normalized.endsWith('.svg')) {
      return 'image/svg+xml';
    }
    if (normalized.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'application/octet-stream';
  }

  private async buildTemplateAssetDataUri(imageFile: string): Promise<string> {
    const imagePath = join(process.cwd(), 'receipt-templates', 'images', imageFile);
    const fileBuffer = await readFile(imagePath);
    const mimeType = this.getMimeTypeForImage(imageFile);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  private async compileRailRoadInvoiceTemplate(
    template: string,
    invoice: any,
  ): Promise<string> {
    const placeholders = this.getRailRoadTemplateData(invoice);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value ?? ''),
      );
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('Rail-road.png');
    const signatureDataUri = await this.buildTemplateAssetDataUri(
      'signature-rail-road-track.png',
    );

    html = html
      .replace('../images/Rail-road.png', logoDataUri)
      .replace('../images/signature-rail-road-track.png', signatureDataUri);

    return html;
  }

  private async compileStaidGlobalInvoiceTemplate(
    template: string,
    invoice: any,
  ): Promise<string> {
    const placeholders = this.getStaidGlobalTemplateData(invoice);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value ?? ''),
      );
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('StaidLogo.svg');
    const signatureDataUri = await this.buildTemplateAssetDataUri(
      'staid-signature.png',
    );

    html = html
      .replace('../images/StaidLogo.svg', logoDataUri)
      .replace('../images/staid-signature.png', signatureDataUri);

    return html;
  }

  private async compileTwoVenturesInvoiceTemplate(
    template: string,
    invoice: any,
  ): Promise<string> {
    const placeholders = this.getTwoVenturesTemplateData(invoice);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value ?? ''),
      );
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('2Ventures-logo.png');
    const signatureDataUri = await this.buildTemplateAssetDataUri(
      'signature-2-venture-invoice.png',
    );

    html = html
      .replace('../images/2Ventures-logo.png', logoDataUri)
      .replace('../images/signature-2-venture-invoice.png', signatureDataUri);

    return html;
  }

  private async generateRailRoadInvoicePdf(invoice: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'invoice',
      'rail-road.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileRailRoadInvoiceTemplate(template, invoice);

    const browser = await launchPuppeteerBrowser();

    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      await page.close();
    }
  }

  private async generateStaidGlobalInvoicePdf(invoice: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'invoice',
      'staid-global.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileStaidGlobalInvoiceTemplate(template, invoice);

    const browser = await launchPuppeteerBrowser();

    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      await page.close();
    }
  }

  private async generateTwoVenturesInvoicePdf(invoice: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'invoice',
      '2-ventures.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileTwoVenturesInvoiceTemplate(template, invoice);

    const browser = await launchPuppeteerBrowser();

    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      await page.close();
    }
  }


}
