import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';
import axios from 'axios';
import * as crypto from 'crypto';

export interface ResetTokenRecord {
  email: string;
  expiresAt: number;
  used: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetTokens = new Map<string, ResetTokenRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly syncService: SyncService,
  ) {}

  async authenticateWithGitHub(code: string): Promise<AuthResponseDto> {
    try {
      if (!code) {
        throw new UnauthorizedException('Invalid GitHub code');
      }

      const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

      // 1. Exchange 'code' for an access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        this.logger.error('Failed to get access token from GitHub', tokenResponse.data);
        throw new UnauthorizedException('Failed to get access token from GitHub');
      }

      // 2. Fetch the user's GitHub profile
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const githubUser = userResponse.data;
      if (!githubUser || !githubUser.id) {
        throw new UnauthorizedException('Failed to fetch GitHub user profile');
      }

      // 3. Find or create the user in the database
      const githubIdString = String(githubUser.id);

      const user = await this.prisma.user.upsert({
        where: { githubId: githubIdString },
        update: {
          name: githubUser.name || null,
          email: githubUser.email || null,
          avatar: githubUser.avatar_url || null,
          bio: githubUser.bio || null,
          location: githubUser.location || null,
          company: githubUser.company || null,
          website: githubUser.blog || null,
          githubUrl: githubUser.html_url || null,
          isOnline: true,
        },
        create: {
          githubId: githubIdString,
          username: githubUser.login,
          name: githubUser.name || null,
          email: githubUser.email || null,
          avatar: githubUser.avatar_url || null,
          bio: githubUser.bio || null,
          location: githubUser.location || null,
          company: githubUser.company || null,
          website: githubUser.blog || null,
          githubUrl: githubUser.html_url || null,
          isOnline: true,
        },
      });

      // 4. Trigger background sync without awaiting
      this.syncService
        .syncUserData(user.id, user.username, accessToken)
        .catch((err) =>
          this.logger.error(`Background sync failed for ${user.username}`, err)
        );

      // 5. Return JWT
      const payload = { sub: user.id, githubId: user.githubId, username: user.username };
      const jwtToken = this.jwtService.sign(payload);

      return {
        accessToken: jwtToken,
        user: {
          id: user.id,
          username: user.username,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to authenticate with GitHub', error.message);
      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }

  /**
   * Generates a 15-minute, single-use password recovery token for an email
   */
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string; token: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    this.resetTokens.set(token, {
      email: normalizedEmail,
      expiresAt,
      used: false,
    });

    this.logger.log(
      `Password reset token created for ${normalizedEmail}. Expiry: 15 minutes`
    );

    return {
      success: true,
      message:
        'If this email address is registered, password recovery instructions have been sent.',
      token,
    };
  }

  /**
   * Verifies if a reset token is valid, unexpired, and single-use
   */
  async verifyResetToken(
    token: string
  ): Promise<{ valid: boolean; email?: string; message?: string }> {
    const record = this.resetTokens.get(token);
    if (!record) {
      return { valid: false, message: 'Invalid or unknown reset token.' };
    }
    if (record.used) {
      return { valid: false, message: 'This reset token has already been used.' };
    }
    if (Date.now() > record.expiresAt) {
      return { valid: false, message: 'This reset token has expired (15-minute limit).' };
    }
    return { valid: true, email: record.email };
  }

  /**
   * Validates token and resets the user's password, invalidating the token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.verifyResetToken(token);
    if (!verification.valid) {
      throw new BadRequestException(
        verification.message || 'Invalid or expired reset token.'
      );
    }

    const record = this.resetTokens.get(token)!;
    record.used = true;
    this.resetTokens.set(token, record);

    this.logger.log(`Password successfully reset for account ${record.email}`);

    return {
      success: true,
      message: 'Password successfully updated. You may now log in with your new credentials.',
    };
  }
}
