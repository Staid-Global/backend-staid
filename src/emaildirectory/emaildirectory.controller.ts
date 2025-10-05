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
import {
  BaseResponseTypeDTO,
  PaginationFilterDTO,
} from 'src/utils/utils.types';

import { EmaildirectoryService } from './emaildirectory.service';
import { CreateEmaildirectoryDto } from './dto/create-emaildirectory.dto';
import { UpdateEmaildirectoryDto } from './dto/update-emaildirectory.dto';

@ApiTags('Emaildirectory')
@Controller('emaildirectory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmaildirectoryController {
  constructor(private readonly emaildirectoryService: EmaildirectoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a Directory' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Directory Added' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: CreateEmaildirectoryDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.emaildirectoryService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin update an Directory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Directory updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateDirectory(
    @Request() req,
    @Param('id') id: string,
    @Body() payload: UpdateEmaildirectoryDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.emaildirectoryService.updateDirectory(req.user.id, id, payload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'get an Directory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Directory retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findADirectory(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.emaildirectoryService.findADirectory(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'get all Directories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Directories retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllDirectories(
    @Request() req,
    @Query() filters: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.emaildirectoryService.findAllDirectories(req.user.id, filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete an Directory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Directory Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteADirectory(
    @Request() req,
    @Param('id') id: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.emaildirectoryService.deleteADirectory(req.user.id, id);
  }
}
