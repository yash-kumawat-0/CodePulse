import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponseDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SyncService } from '../sync/sync.service';
export interface ResetTokenRecord {
    email: string;
    expiresAt: number;
    used: boolean;
}
export declare class AuthService {
    private readonly prisma;
    private readonly configService;
    private readonly jwtService;
    private readonly syncService;
    private readonly logger;
    private readonly resetTokens;
    constructor(prisma: PrismaService, configService: ConfigService, jwtService: JwtService, syncService: SyncService);
    authenticateWithGitHub(code: string): Promise<AuthResponseDto>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
        token: string;
    }>;
    verifyResetToken(token: string): Promise<{
        valid: boolean;
        email?: string;
        message?: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
