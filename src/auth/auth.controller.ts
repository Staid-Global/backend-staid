import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  BaseResponseTypeDTO,
  changePasswordDTO,
  loginDTO,
  registerDTO,
  updateProfileDto,
} from './dto/create-auth.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SendEmailDTO, SendEmailDTOOOOOO } from 'src/utils/utils.types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User Register' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Request() req,
    @Body() dto: registerDTO,
  ): Promise<BaseResponseTypeDTO> {
    return this.authService.create(req.user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User Login' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async login(@Body() dto: loginDTO): Promise<BaseResponseTypeDTO> {
    return this.authService.login(dto);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User update their profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User update' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateProfile(
    @Request() req,
    @Body() payload: updateProfileDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.authService.updateProfile(req.user.id, payload);
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorized Admin update user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateAUserProfile(
    @Request() req,
    @Param('userId') userId: string,
    @Body() payload: updateProfileDto,
  ): Promise<BaseResponseTypeDTO> {
    return this.authService.updateAUserProfile(req.user.id, userId, payload);
  }

  @Post('change/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User change their password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Change password' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async changePassword(
    @Request() req,
    @Body() payload: changePasswordDTO,
  ): Promise<BaseResponseTypeDTO> {
    const result = await this.authService.changePassword(req.user.id, payload);
    return result;
  }

  // @Post('send/email')
  // @ApiOperation({ summary: 'Send any email' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Email sent' })
  // @ApiResponse({
  //   status: HttpStatus.BAD_REQUEST,
  //   description: 'Invalid input data',
  // })
  // async SendEmail(@Body() dto: SendEmailDTO): Promise<BaseResponseTypeDTO> {
  //   return this.authService.sendAnyEmail(dto);
  // }
}
