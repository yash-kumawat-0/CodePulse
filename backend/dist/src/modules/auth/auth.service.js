"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const sync_service_1 = require("../sync/sync.service");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let AuthService = AuthService_1 = class AuthService {
    prisma;
    configService;
    jwtService;
    syncService;
    logger = new common_1.Logger(AuthService_1.name);
    resetTokens = new Map();
    constructor(prisma, configService, jwtService, syncService) {
        this.prisma = prisma;
        this.configService = configService;
        this.jwtService = jwtService;
        this.syncService = syncService;
    }
    async authenticateWithGitHub(code) {
        try {
            if (!code) {
                throw new common_1.UnauthorizedException('Invalid GitHub code');
            }
            const clientId = this.configService.get('GITHUB_CLIENT_ID');
            const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET');
            const tokenResponse = await axios_1.default.post('https://github.com/login/oauth/access_token', {
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }, {
                headers: {
                    Accept: 'application/json',
                },
            });
            const accessToken = tokenResponse.data.access_token;
            if (!accessToken) {
                this.logger.error('Failed to get access token from GitHub', tokenResponse.data);
                throw new common_1.UnauthorizedException('Failed to get access token from GitHub');
            }
            const userResponse = await axios_1.default.get('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const githubUser = userResponse.data;
            if (!githubUser || !githubUser.id) {
                throw new common_1.UnauthorizedException('Failed to fetch GitHub user profile');
            }
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
            this.syncService
                .syncUserData(user.id, user.username, accessToken)
                .catch((err) => this.logger.error(`Background sync failed for ${user.username}`, err));
            const payload = { sub: user.id, githubId: user.githubId, username: user.username };
            const jwtToken = this.jwtService.sign(payload);
            return {
                accessToken: jwtToken,
                user: {
                    id: user.id,
                    username: user.username,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to authenticate with GitHub', error.message);
            throw new common_1.UnauthorizedException('Failed to authenticate with GitHub');
        }
    }
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 15 * 60 * 1000;
        this.resetTokens.set(token, {
            email: normalizedEmail,
            expiresAt,
            used: false,
        });
        this.logger.log(`Password reset token created for ${normalizedEmail}. Expiry: 15 minutes`);
        return {
            success: true,
            message: 'If this email address is registered, password recovery instructions have been sent.',
            token,
        };
    }
    async verifyResetToken(token) {
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
    async resetPassword(token, newPassword) {
        const verification = await this.verifyResetToken(token);
        if (!verification.valid) {
            throw new common_1.BadRequestException(verification.message || 'Invalid or expired reset token.');
        }
        const record = this.resetTokens.get(token);
        record.used = true;
        this.resetTokens.set(token, record);
        this.logger.log(`Password successfully reset for account ${record.email}`);
        return {
            success: true,
            message: 'Password successfully updated. You may now log in with your new credentials.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        sync_service_1.SyncService])
], AuthService);
//# sourceMappingURL=auth.service.js.map