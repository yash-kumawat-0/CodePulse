import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class GitHubLoginDto {
  @ApiProperty({
    description: 'GitHub OAuth Authorization Code',
    example: 'gho_16C7e42F292c6912E7710c838347Ae178B4a',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Registered developer email address',
    example: 'developer@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Cryptographic reset token',
    example: 'a1b2c3d4e5f6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewSecurePassword123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: any; // We will replace with UserDto later
}
