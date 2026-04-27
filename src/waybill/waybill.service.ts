import { CreateWaybillDto } from './dto/create-waybill.dto';
import { UpdateWaybillDto } from './dto/update-waybill.dto';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BaseResponseTypeDTO,
  IPaginationFilter,
  SendEmailDTOOOOOO,
} from 'src/utils/utils.types';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Waybill } from './entities/waybill.entity';
import * as PDFDocument from 'pdfkit';
import { MailjetService } from 'src/Email/mailjet';
import { Company } from 'src/company/entities/company.entity';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { launchPuppeteerBrowser } from 'src/utils/puppeteer.util';
const baseUrl = 'https://staid-redesigned.vercel.app/view';
// const baseUrl ='https://staidgloballtd.com/view'

@Injectable()
export class WaybillService {
  constructor(
    @InjectModel(Waybill.name)
    private readonly waybillModel: Model<Waybill>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private mailjetSrv: MailjetService,
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
    if (data?.category === 'rail-road-track') {
      return this.generateRailRoadWaybillPdf(data);
    }
    if (data?.category === 'staid-global') {
      return this.generateStaidGlobalWaybillPdf(data);
    }
    if (data?.category === 'two-ventures') {
      return this.generateTwoVenturesWaybillPdf(data);
    }

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

  private buildRailRoadWaybillRows(items: any[] = []): string {
    if (!Array.isArray(items) || items.length === 0) {
      return `
        <tr>
          <td class="data-cell sn">1</td>
          <td class="data-cell description-cell">No waybill items</td>
        </tr>
      `;
    }

    return items
      .map((item, index) => {
        const description = String(item?.description || '-');
        return `
          <tr>
            <td class="data-cell sn">${index + 1}</td>
            <td class="data-cell description-cell">${description}</td>
          </tr>
          <tr class="spacer"><td colspan="2"></td></tr>
        `;
      })
      .join('');
  }

  private buildGenericWaybillRows(items: any[] = []): string {
    if (!Array.isArray(items) || items.length === 0) {
      return `
        <tr>
          <td>1</td>
          <td class="description">No waybill items</td>
        </tr>
      `;
    }

    return items
      .map((item, index) => {
        const description = String(item?.description || '-');
        return `
          <tr>
            <td>${index + 1}</td>
            <td class="description">${description}</td>
          </tr>
        `;
      })
      .join('');
  }

  private getRailRoadWaybillTemplateData(waybill: any) {
    const createdAt = waybill?.createdAt ? new Date(waybill.createdAt) : new Date();
    const day = `${createdAt.getDate()}`.padStart(2, '0');
    const month = createdAt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = `${createdAt.getFullYear()}`;

    return {
      TO_NAME: waybill?.company?.name || 'Customer',
      TO_ADDRESS: waybill?.company?.address || '-',
      DATE_DAY: day,
      DATE_MONTH: month,
      DATE_YEAR: year,
      ROWS_HTML: this.buildRailRoadWaybillRows(waybill?.items || []),
    };
  }

  private getStaidGlobalWaybillTemplateData(waybill: any) {
    const createdAt = waybill?.createdAt ? new Date(waybill.createdAt) : new Date();
    const waybillDate = createdAt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      TO_NAME: waybill?.company?.name || 'Customer',
      TO_ADDRESS: waybill?.company?.address || '-',
      WAYBILL_NO: waybill?.way_id || '-',
      WAYBILL_DATE: waybillDate.toUpperCase(),
      LPO_NO: waybill?.lpo || '-',
      ROWS_HTML: this.buildGenericWaybillRows(waybill?.items || []),
    };
  }

  private getTwoVenturesWaybillTemplateData(waybill: any) {
    const createdAt = waybill?.createdAt ? new Date(waybill.createdAt) : new Date();
    const waybillDate = createdAt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return {
      TO_NAME: waybill?.company?.name || 'Customer',
      TO_ADDRESS: waybill?.company?.address || '-',
      WAYBILL_NO: waybill?.way_id || '-',
      WAYBILL_DATE: waybillDate.toUpperCase(),
      LPO_NO: waybill?.lpo || '-',
      ROWS_HTML: this.buildGenericWaybillRows(waybill?.items || []),
    };
  }

  private async compileRailRoadWaybillTemplate(
    template: string,
    waybill: any,
  ): Promise<string> {
    const placeholders = this.getRailRoadWaybillTemplateData(waybill);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('Rail-road.png');
    const signatureDataUri = await this.buildTemplateAssetDataUri(
      'signature-rail-road-track.png',
    );

    return html
      .replace('../images/Rail-road.png', logoDataUri)
      .replace('../images/signature-rail-road-track.png', signatureDataUri);
  }

  private async compileStaidGlobalWaybillTemplate(
    template: string,
    waybill: any,
  ): Promise<string> {
    const placeholders = this.getStaidGlobalWaybillTemplateData(waybill);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('StaidLogo.svg');
    const signatureDataUri = await this.buildTemplateAssetDataUri('staid-signature.png');

    return html
      .replace('../images/StaidLogo.svg', logoDataUri)
      .replace('../images/staid-signature.png', signatureDataUri);
  }

  private async compileTwoVenturesWaybillTemplate(
    template: string,
    waybill: any,
  ): Promise<string> {
    const placeholders = this.getTwoVenturesWaybillTemplateData(waybill);
    let html = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value ?? ''));
    });

    const logoDataUri = await this.buildTemplateAssetDataUri('2Ventures-logo.png');
    const signatureDataUri = await this.buildTemplateAssetDataUri(
      'signature-2-ventures.png',
    );

    return html
      .replace('../images/2Ventures-logo.png', logoDataUri)
      .replace('../images/signature-2-ventures.png', signatureDataUri);
  }

  private async renderWaybillTemplateToPdf(html: string): Promise<Buffer> {
    const browser = await launchPuppeteerBrowser();

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 1120, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('print');
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdfBytes);
    } finally {
      await browser.close();
    }
  }

  private async generateRailRoadWaybillPdf(waybill: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'waybill',
      'rail-road.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileRailRoadWaybillTemplate(template, waybill);
    return this.renderWaybillTemplateToPdf(html);
  }

  private async generateStaidGlobalWaybillPdf(waybill: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'waybill',
      'staid-global.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileStaidGlobalWaybillTemplate(template, waybill);
    return this.renderWaybillTemplateToPdf(html);
  }

  private async generateTwoVenturesWaybillPdf(waybill: any): Promise<Buffer> {
    const templatePath = join(
      process.cwd(),
      'receipt-templates',
      'waybill',
      '2-ventures.html',
    );
    const template = await readFile(templatePath, 'utf8');
    const html = await this.compileTwoVenturesWaybillTemplate(template, waybill);
    return this.renderWaybillTemplateToPdf(html);
  }

  async sendWaybillEmail(payload) {
    let body = '';
    const waybill = await this.waybillModel.findOne({
      hashed_id: payload.hashedId,
    });
    const company = await this.companyModel.findById(waybill.company);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (waybill.category === 'rail-road-track') {
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
            <p>Dear ${company.name},</p>

            <p>${payload.body}</p>

            <p>Kindly click the button below to view your document securely.</p>

            <p style="text-align: center">
              <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
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

    if (waybill.category === 'staid-global') {
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
        <p>Dear ${company.name},</p>

        <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
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

    if (waybill.category === 'two-ventures') {
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
      <p>Dear ${company.name},</p>

      <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/waybill/${payload.hashedId}" class="btn">View Document</a>
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
    `;
    }

    // ✅ ensure non-empty
    if (!body.trim()) {
      throw new Error(
        `No email template found for category: ${waybill.category}`,
      );
    }
    await this.mailjetSrv.sendMail(body, payload.subject, payload.email);
  }

  async sendWaybillEmailWithPdfAttachment(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    const waybillData = await this.getDataById(payload.hashedId);
    const pdfBuffer = await this.generatePdf(waybillData);

    let body = '';
    const waybill = await this.waybillModel.findOne({
      hashed_id: payload.hashedId,
    });
    const company = await this.companyModel.findById(waybill.company);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (waybill.category === 'rail-road-track') {
      body = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Staid Email Template</title>
      </head>
      <body>
        <div>
          <p>Dear ${company.name},</p>
          <p>${payload.body}</p>
          <p><a href="${baseUrl}/waybill/${payload.hashedId}">View Document</a></p>
        </div>
      </body>
    </html>
    `;
    }

    if (waybill.category === 'staid-global') {
      body = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Staid Email Template</title>
      </head>
      <body>
        <div>
          <p>Dear ${company.name},</p>
          <p>${payload.body}</p>
          <p><a href="${baseUrl}/waybill/${payload.hashedId}">View Document</a></p>
        </div>
      </body>
    </html>
    `;
    }

    if (waybill.category === 'two-ventures') {
      body = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Staid Email Template</title>
      </head>
      <body>
        <div>
          <p>Dear ${company.name},</p>
          <p>${payload.body}</p>
          <p><a href="${baseUrl}/waybill/${payload.hashedId}">View Document</a></p>
        </div>
      </body>
    </html>
    `;
    }

    if (!body.trim()) {
      throw new Error(`No email template found for category: ${waybill.category}`);
    }

    await this.mailjetSrv.sendMail(body, payload.subject, payload.email, [
      {
        ContentType: 'application/pdf',
        Filename: `waybill-${payload.hashedId}.pdf`,
        Base64Content: pdfBuffer.toString('base64'),
      },
    ]);

    return {
      message: 'Waybill Email Sent with PDF Attachment',
      success: true,
      code: HttpStatus.OK,
    };
  }

  async sendWaybillEmaill(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    await this.sendWaybillEmail(payload);
    return {
      message: 'Waybill Email Sent',
      success: true,
      code: HttpStatus.OK,
    };
  }
}
