export declare class GitHubLoginDto {
    code: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: any;
}
