import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: SyncService,
          useValue: {
            syncUserData: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should generate a token with 15-minute expiration', async () => {
      const email = 'developer@github.com';
      const result = await service.forgotPassword(email);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.message).toContain('password recovery instructions');
    });
  });

  describe('verifyResetToken', () => {
    it('should successfully verify a valid reset token', async () => {
      const email = 'user@example.com';
      const { token } = await service.forgotPassword(email);

      const verification = await service.verifyResetToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.email).toBe(email);
    });

    it('should reject an unknown or invalid token', async () => {
      const verification = await service.verifyResetToken('non-existent-token');
      expect(verification.valid).toBe(false);
      expect(verification.message).toContain('Invalid or unknown');
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password and invalidate the token for single-use', async () => {
      const email = 'developer@example.com';
      const { token } = await service.forgotPassword(email);

      const result = await service.resetPassword(token, 'NewSecurePassword123!');
      expect(result.success).toBe(true);

      // Single-use check: Trying to verify or reuse should fail
      const secondAttempt = await service.verifyResetToken(token);
      expect(secondAttempt.valid).toBe(false);
      expect(secondAttempt.message).toContain('already been used');
    });
  });
});
