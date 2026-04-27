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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO, pagiQuoteDTO, SendEmailDTOOOOOO } from 'src/utils/utils.types';

@ApiTags('Invoice')
@Controller('invoice')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a Invoice' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Invoice Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateInvoiceDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update an invoice' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoice updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateInvoice(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateInvoiceDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.updateInvoice(req.user.id, id, payload);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get an Invoice' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoice retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAnInvoice(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.findAInvoice(req.user.id, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get all invoices' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoices retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllInvoices(
    @Request() req,
    @Query() filters: pagiQuoteDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.findAllInvoices(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete an invoice' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoice Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteAnInvoice(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.deleteAnInvoice(req.user.id, id);
  }

  // @Get('pdf/:id')
  // async generatePdf(
  //   @Request() req,
  //   @Param('id') id: string,
  // ): Promise<StreamableFile> {
  //   const data = await this.invoiceService.getDataById(req.user.id, id);
  //   const pdfBuffer = await this.invoiceService.generatePdf(data);

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
  //     disposition: `attachment; filename=invoice-${uniqueNumber}.pdf`,
  //   });
  // }

  @Get('pdf/:id/download')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoice PDF downloaded' })
  async downloadInvoicePdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.invoiceService.getDataById(id);
    const pdfBuffer = await this.invoiceService.generatePdf(data);
    const reference = `invoice-${Date.now()}`;

    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `attachment; filename=${reference}.pdf`,
    });
  }

  @Get('pdf/:id/preview')
  @ApiOperation({ summary: 'Preview invoice PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invoice PDF previewed' })
  async previewInvoicePdf(@Param('id') id: string): Promise<StreamableFile> {
    const data = await this.invoiceService.getDataById(id);
    const pdfBuffer = await this.invoiceService.generatePdf(data);
    return new StreamableFile(pdfBuffer, {
      type: 'application/pdf',
      disposition: `inline; filename=invoice-${id}.pdf`,
    });
  }

    @Post('send/email')
    @ApiOperation({ summary: 'Send invoice email' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Email sent' })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
    })
    async sendInvoiceEmail(@Body() dto: SendEmailDTOOOOOO): Promise<BaseResponseTypeDTO> {
      return this.invoiceService.sendInvoiceEmaill(dto);
    }

  @Post('send/email/with-attachment')
  @ApiOperation({ summary: 'Send invoice email with PDF attachment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email with PDF sent' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async sendInvoiceEmailWithAttachment(
    @Body() dto: SendEmailDTOOOOOO,
  ): Promise<BaseResponseTypeDTO> {
    return this.invoiceService.sendInvoiceEmailWithPdfAttachment(dto);
  }
  
}
