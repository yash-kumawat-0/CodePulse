import { AuthService } from './auth.service';
import { GitHubLoginDto, ForgotPasswordDto, ResetPasswordDto, AuthResponseDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    githubLogin(loginDto: GitHubLoginDto): Promise<AuthResponseDto>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
        token: string;
    }>;
    verifyResetToken(token: string): Promise<{
        valid: boolean;
        email?: string;
        message?: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
