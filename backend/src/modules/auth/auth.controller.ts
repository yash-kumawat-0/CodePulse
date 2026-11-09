import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  GitHubLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate using GitHub OAuth code' })
  @ApiResponse({
    status: 200,
    description: 'Successful authentication',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired GitHub code' })
  async githubLogin(@Body() loginDto: GitHubLoginDto): Promise<AuthResponseDto> {
    return this.authService.authenticateWithGitHub(loginDto.code);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate password recovery for registered email' })
  @ApiResponse({
    status: 200,
    description: 'Password recovery request accepted',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Get('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify validity of a password reset token' })
  @ApiQuery({ name: 'token', type: String })
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset account password with valid token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully updated',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
