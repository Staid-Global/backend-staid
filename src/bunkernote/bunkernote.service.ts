import { CreateBunkernoteDto } from './dto/create-bunkernote.dto';
import { UpdateBunkernoteDto } from './dto/update-bunkernote.dto';
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
import { Bunkernote } from './entities/bunkernote.entity';
import { Company } from 'src/company/entities/company.entity';
import { MailjetService } from 'src/Email/mailjet';
const baseUrl = 'https://staid-redesigned.vercel.app/view';
// const baseUrl ='https://staidgloballtd.com/view'

@Injectable()
export class BunkernoteService {
  constructor(
    @InjectModel(Bunkernote.name)
    private readonly bunkerModel: Model<Bunkernote>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private mailjetSrv: MailjetService,
  ) {}

  async create(
    userId: string,
    payload: CreateBunkernoteDto,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId });

      if (!admin) {
        throw new UnauthorizedException('Unauthorized');
      }

      const bunker = new this.bunkerModel({
        ...payload,
        added_by: admin._id.toString(),
        edited_by: admin._id.toString(),
      });
      await bunker.save();

      return {
        data: bunker,
        success: true,
        code: HttpStatus.OK,
        message: 'Bunker note added sucessfully',
      };
    } catch (error) {
      throw new BadRequestException(
        'Error: Can not add a Bunker',
        error.message,
      );
    }
  }

  async updateBunker(
    userId,
    bunkerId: string,
    payload: UpdateBunkernoteDto,
  ): Promise<BaseResponseTypeDTO> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bunker = await this.bunkerModel.findById(bunkerId).exec();

    if (!bunker) {
      throw new NotFoundException('Bunker not found');
    }

    if ('seller' in payload) {
      bunker.seller = payload.seller;
    }
    if ('vessel_name' in payload) {
      bunker.vessel_name = payload.vessel_name;
    }

    if ('port' in payload) {
      bunker.port = payload.port;
    }

    if ('delivery' in payload) {
      bunker.delivery = payload.delivery;
    }

    if ('dateOfCommencement' in payload) {
      bunker.dateOfCommencement = payload.dateOfCommencement;
    }

    if ('product' in payload) {
      bunker.product = payload.product;
    }

    if ('quantity' in payload) {
      bunker.quantity = payload.quantity;
    }

    if ('start_pumping' in payload) {
      bunker.start_pumping = payload.start_pumping;
    }

    if ('finish_pumping' in payload) {
      bunker.finish_pumping = payload.finish_pumping;
    }

    if ('density' in payload) {
      bunker.density = payload.density;
    }

    if ('flashpoint' in payload) {
      bunker.flashpoint = payload.flashpoint;
    }

    if ('sulphur' in payload) {
      bunker.sulphur = payload.sulphur;
    }

    if ('status' in payload) {
      bunker.status = payload.status;
    }

    if ('disclaimer_note' in payload) {
      bunker.disclaimer_note = payload.disclaimer_note;
    }

    bunker.edited_by = user._id.toString();
    await bunker.save();
    try {
      return {
        data: bunker,
        success: true,
        code: HttpStatus.OK,
        message: 'Bunker note updated',
      };
    } catch (error) {}
  }

  async findABunker(userId: string, id: string): Promise<BaseResponseTypeDTO> {
    try {
      const admin = await this.userModel.findOne({ _id: userId }).exec();

      if (!admin) {
        throw new UnauthorizedException('Not authorized');
      }
      const bunker = await this.bunkerModel.findById(id).exec();

      if (!bunker) {
        throw new NotFoundException('bunker not found');
      }
      return {
        data: bunker,
        success: true,
        code: HttpStatus.OK,
        message: 'bunker Found',
      };
    } catch (ex) {
      throw ex;
    }
  }

  async findAllBunkers(
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
        const bunkerFields = Object.keys(this.bunkerModel.schema.obj);

        searchFilter.$or = bunkerFields
          .map((field) => {
            const fieldType = this.bunkerModel.schema.obj[field]?.type;
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

      const totalCount = await this.bunkerModel.countDocuments(searchFilter);

      const bunkers = await this.bunkerModel
        .find(searchFilter)
        .populate([
          { path: 'added_by' },
          { path: 'edited_by' },
          { path: 'seller' },
        ])
        .skip(skip)
        .limit(limit)
        .lean();

      if (!bunkers || bunkers.length === 0) {
        return {
          data: [],
          success: true,
          code: HttpStatus.OK,
          message: 'No Bunker note found.',
        };
      }

      return {
        data: { totalCount, bunkers },
        success: true,
        code: HttpStatus.OK,
        message: 'Bunker note fetched.',
        limit: filters?.limit,
        page: filters?.page,
        search: filters?.search,
      };
    } catch (ex) {
      throw ex;
    }
  }

  async deleteABunker(
    id: string,
    bunkerId: string,
  ): Promise<BaseResponseTypeDTO> {
    try {
      const user = await this.userModel
        .findOne({ _id: id, role: 'ADMIN' })
        .exec();

      if (!user) {
        throw new UnauthorizedException('Not authorized');
      }

      const deletingBunker = await this.bunkerModel.findById(bunkerId).exec();

      if (!deletingBunker) {
        throw new NotFoundException('Bunker not found');
      }

      await deletingBunker.deleteOne();
      return {
        success: true,
        code: HttpStatus.OK,
        message: 'Bunker note Deleted',
      };
    } catch (ex) {
      throw ex;
    }
  }

    async sendBunkernoteEmail(payload) {
    const bunkernote = await this.bunkerModel.findOne({
      _id: payload.hashedId,
    });
    const co = await this.companyModel.findById(bunkernote.seller);
    if (!co) {
      throw new NotFoundException('Company not found');
    }

    const body = `
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
        <p>Dear ${co.name},</p>

        <p>${payload.body}</p>

        <p>Kindly click the button below to view your document securely.</p>

        <p style="text-align: center">
          <a href="${baseUrl}/bunkernote/${payload.hashedId}" class="btn">View Document</a>
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

    // ✅ ensure non-empty
    if (!body.trim()) {
      throw new Error(`No email template found for bunkernote`);
    }
    await this.mailjetSrv.sendMail(body, payload.subject, payload.email);
  }


  async sendBunkernoteEmaill(
    payload: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    await this.sendBunkernoteEmail(payload);
    return {
      message: 'Bunker Note Email Sent',
      success: true,
      code: HttpStatus.OK,
    };
  }
}
