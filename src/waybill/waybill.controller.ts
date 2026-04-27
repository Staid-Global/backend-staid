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
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO, pagiQuoteDTO, SendEmailDTOOOOOO } from 'src/utils/utils.types';
import { WaybillService } from './waybill.service';
import { CreateWaybillDto } from './dto/create-waybill.dto';
import { UpdateWaybillDto } from './dto/update-waybill.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Waybill')
@Controller('waybill')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class WaybillController {
  constructor(private readonly waybillService: WaybillService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a Waybill' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Waybill Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateWaybillDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update a Waybill' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybill updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateWaybill(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateWaybillDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.updateWaybill(req.user.id, id, payload);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get a Waybill' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybill retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAWaybill(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.findAWaybill(req.user.id, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get all Waybills' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybills retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllWaybills(
    @Request() req,
    @Query() filters: pagiQuoteDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.findAllWaybills(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a Waybill' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybill Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteAnWaybill(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.deleteAWaybill(req.user.id, id);
  }

  // @Get('pdf/:id')
  // async generatePdf(
  //   @Request() req,
  //   @Param('id') id: string,
  // ): Promise<StreamableFile> {
  //   const data = await this.waybillService.getDataById(id);
  //   const pdfBuffer = await this.waybillService.generatePdf(data);

  //   async function generateUniqueNumber(length = 4): Promise<string> {
  //     let result = '';
  //     const digits = '0123456789';

  //     for (let i = 0; i < length; i++) {
  //       result += digits.charAt(Math.floor(Math.random() * digits.length));
  //     }

  //     return result;
  //   }

  //   const uniqueNumber = await generateUniqueNumber();

  //   return new StreamableFile(pdfBuffer, {
  //     type: 'application/pdf',
  //     disposition: `attachment; filename=waybill-${uniqueNumber}.pdf`,
  //   });
  // }

  @Get('pdf/:id/download')
  @ApiOperation({ summary: 'Download waybill PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybill PDF downloaded' })
  async downloadWaybillPdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.waybillService.getDataById(id);
    const pdfBuffer = await this.waybillService.generatePdf(data);
    const reference = `waybill-${Date.now()}`;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=${reference}.pdf`,
    });
  }

  @Get('pdf/:id/preview')
  @ApiOperation({ summary: 'Preview waybill PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Waybill PDF previewed' })
  async previewWaybillPdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.waybillService.getDataById(id);
    const pdfBuffer = await this.waybillService.generatePdf(data);
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `inline; filename=waybill-${id}.pdf`,
    });
  }

  @Post('send/waybill-email')
  @ApiOperation({ summary: 'Send waybill email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email sent' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async sendWaybillEmail(@Body() dto: SendEmailDTOOOOOO): Promise<BaseResponseTypeDTO> {
    return this.waybillService.sendWaybillEmaill(dto);
  }

  @Post('send/waybill-email/with-attachment')
  @ApiOperation({ summary: 'Send waybill email with PDF attachment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email with PDF sent' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async sendWaybillEmailWithAttachment(
    @Body() dto: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    return this.waybillService.sendWaybillEmailWithPdfAttachment(dto);
  }
}
