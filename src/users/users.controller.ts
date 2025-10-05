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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BaseResponseTypeDTO } from 'src/auth/dto/create-auth.dto';
import { PaginationFilterDTO } from 'src/utils/utils.types';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAUser(
    @Request() req,
    @Param('userId') userId: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.usersService.findAUser(req.user.id, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrived' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async findAllUsers(
    @Request() req,
    @Query() filters: PaginationFilterDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.usersService.findAllUsers(req.user.id, filters);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin delete a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User Deleted' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async deleteUser(
    @Request() req,
    @Param('userId') userId: string,
  ): Promise<BaseResponseTypeDTO> {
    return this.usersService.deleteAUser(req.user.id, userId);
  }
}
