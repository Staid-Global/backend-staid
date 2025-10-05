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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { PaginationFilterDTO, pagiQuoteDTO } from 'src/utils/utils.types';

@ApiTags('Quotation')
@Controller('quotation')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a Quotation' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Quotation Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateQuotationDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.quotationService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update quotation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quotation updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateQuotation(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateQuotationDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.quotationService.updateQuotation(req.user.id, id, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get a quotation' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Quotation retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAQuotation(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.quotationService.findAQuotation(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'get all quotations' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.OK, description: 'Quotations retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllQuotations(
    @Request() req,
    @Query() filters: pagiQuoteDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.quotationService.findAllQuotations(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a quotation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Quotation Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteAQuotation(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.quotationService.deleteAQuotation(req.user.id, id);
  }

  // @Get('pdf/:id')
  // async generatePdf(
  //   @Param('id') id: string,
  // ): Promise<StreamableFile> {
  //   const data = await this.quotationService.getDataById(id);
  //   const pdfBuffer = await this.quotationService.generatePdf(data);

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
  //     disposition: `attachment; filename=quotation-${uniqueNumber}.pdf`,
  //   });
  // }

  @Get('pdf/:id')
  async getQuotationMetadata(@Param('id') id: string) {
    const data = await this.quotationService.getDataById(id);

    async function generateUniqueNumber(length = 4): Promise<string> {
      let result = '';
      const digits = '0123456789';

      for (let i = 0; i < length; i++) {
        result += digits.charAt(Math.floor(Math.random() * digits.length));
      }

      return result;
    }

    const uniqueNumber = await generateUniqueNumber();

    return {
      quotationId: id,
      reference: `quotation-${uniqueNumber}`,
      metadata: data,
      generatedAt: new Date().toISOString(),
    };
  }
}
