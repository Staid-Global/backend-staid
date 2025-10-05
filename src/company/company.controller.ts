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
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { PaginationFilterDTO } from 'src/utils/utils.types';

@ApiTags('Company')
@Controller('company')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a company' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Company Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateCompanyDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.companyService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update company' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Company updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateCompany(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateCompanyDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.companyService.updateCompany(req.user.id, id, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get a company' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Company retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findACompany(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.companyService.findACompany(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'get all companies' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Companies retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllCompany(
    @Request() req,
    @Query() filters: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.companyService.findAllCompany(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a company' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Company Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteACompany(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.companyService.deleteACompany(req.user.id, id);
  }
}
