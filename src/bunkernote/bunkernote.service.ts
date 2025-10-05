import { CreateBunkernoteDto } from './dto/create-bunkernote.dto';
import { UpdateBunkernoteDto } from './dto/update-bunkernote.dto';
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
import { Bunkernote } from './entities/bunkernote.entity';



@Injectable()
export class BunkernoteService {

    constructor(
      @InjectModel(Bunkernote.name)
      private readonly bunkerModel: Model<Bunkernote>,
      @InjectModel(User.name) private readonly userModel: Model<User>,
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
  
    async findABunker(userId:string, id: string): Promise<BaseResponseTypeDTO> {
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
  
        const deletingBunker = await this.bunkerModel
          .findById(bunkerId)
          .exec();
  
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
  

}
