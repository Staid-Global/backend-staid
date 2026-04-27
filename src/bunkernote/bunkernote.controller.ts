import { BunkernoteService } from './bunkernote.service';
import { CreateBunkernoteDto } from './dto/create-bunkernote.dto';
import { UpdateBunkernoteDto } from './dto/update-bunkernote.dto';
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  BaseResponseTypeDTO,
  pagiQuoteDTO,
  SendEmailDTOOOOOO,
} from 'src/utils/utils.types';

@ApiTags('Bunkernote')
@Controller('bunkernote')
export class BunkernoteController {
  constructor(private readonly bunkernoteService: BunkernoteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a bunker note' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Bunkernote Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateBunkernoteDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update a bunkernote' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernote updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateBunker(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateBunkernoteDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.updateBunker(req.user.id, id, payload);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get a bunkernote' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernote retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findABunker(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.findABunker(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'get all bunkernotes' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernotes retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllBunkers(
    @Request() req,
    @Query() filters: pagiQuoteDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.findAllBunkers(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a bunkernote' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernote Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteABunker(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.deleteABunker(req.user.id, id);
  }

  @Get('pdf/:id/download')
  @ApiOperation({ summary: 'Download bunkernote PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernote PDF downloaded' })
  async downloadBunkernotePdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.bunkernoteService.getDataById(id);
    const pdfBuffer = await this.bunkernoteService.generatePdf(data);
    const reference = `bunkernote-${Date.now()}`;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=${reference}.pdf`,
    });
  }

  @Get('pdf/:id/preview')
  @ApiOperation({ summary: 'Preview bunkernote PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bunkernote PDF previewed' })
  async previewBunkernotePdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.bunkernoteService.getDataById(id);
    const pdfBuffer = await this.bunkernoteService.generatePdf(data);
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `inline; filename=bunkernote-${id}.pdf`,
    });
  }

  @Post('send/email')
  @ApiOperation({ summary: 'Send bunker-note email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email sent' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async sendBunkernoteEmail(
    @Body() dto: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.sendBunkernoteEmaill(dto);
  }

  @Post('send/email/with-attachment')
  @ApiOperation({ summary: 'Send bunkernote email with PDF attachment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email with PDF sent' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async sendBunkernoteEmailWithAttachment(
    @Body() dto: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    return this.bunkernoteService.sendBunkernoteEmailWithPdfAttachment(dto);
  }
}
