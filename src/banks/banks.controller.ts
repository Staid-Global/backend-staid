import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO, pagiQuoteDTO } from 'src/utils/utils.types';

@ApiTags('Banks')
@Controller('banks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a bank' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bank Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateBankDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.banksService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update a bank' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bank updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateBank(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateBankDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.banksService.updateBank(req.user.id, id, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get a bank' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bank retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findABank(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.banksService.findABank(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'get all banks' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Banks retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllBanks(
    @Request() req,
    @Query() filters: pagiQuoteDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.banksService.findAllBanks(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a bank' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bank Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteABank(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.banksService.deleteABank(req.user.id, id);
  }
}
