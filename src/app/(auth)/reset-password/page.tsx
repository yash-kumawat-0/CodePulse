"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  verifyResetToken,
  completePasswordReset,
} from "@/lib/password-reset-store";
import { updateUserPassword } from "@/lib/auth-store";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verification state
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValidity, setTokenValidity] = useState<{
    valid: boolean;
    reason?: "invalid" | "expired" | "used";
    email?: string;
  }>({ valid: false });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password", "");

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);

  useEffect(() => {
    if (!token) {
      setIsCheckingToken(false);
      setTokenValidity({ valid: false, reason: "invalid" });
      return;
    }

    const check = verifyResetToken(token);
    setTokenValidity({
      valid: check.valid,
      reason: check.reason,
      email: check.record?.email,
    });
    setIsCheckingToken(false);
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const success = completePasswordReset(token);
      if (!success) {
        toast.error("Password reset failed", {
          description: "This link may have expired or already been used.",
        });
        setTokenValidity({ valid: false, reason: "used" });
        return;
      }

      // Persist the updated password for this email account
      if (tokenValidity.email) {
        updateUserPassword(tokenValidity.email, data.password);
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!", {
        description: "You can now log in with your new credentials.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Verifying security token...</p>
      </div>
    );
  }

  // Token is Invalid, Expired, or Already Used
  if (!tokenValidity.valid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-muted-foreground">
            {tokenValidity.reason === "expired"
              ? "This recovery link has expired (links are valid for 15 minutes for your security)."
              : tokenValidity.reason === "used"
              ? "This recovery link has already been used. Each link is single-use only."
              : "This recovery link is invalid or malformed."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground text-left space-y-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Security Notice
          </div>
          <p>
            To protect your account, password recovery links are cryptographically bound,
            single-use, and expire automatically after 15 minutes.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition-all"
          >
            <span>Request a New Reset Link</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to sign in
          </Link>
        </div>
      </motion.div>
    );
  }

  // Success view after resetting password
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Password Updated!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully updated. Redirecting you to the sign-in page...
          </p>
        </div>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
        >
          <span>Sign In Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    );
  }

  // Default: Valid Token - Display Set New Password Form
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
        <KeyRound className="w-6 h-6 text-purple-400" />
      </div>

      <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {tokenValidity.email ? (
          <>
            Create a new, strong password for{" "}
            <strong className="text-foreground">{tokenValidity.email}</strong>.
          </>
        ) : (
          "Enter your new password below to regain account access."
        )}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters with 1 number & uppercase"
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>
          )}

          {/* Password strength meter */}
          {passwordValue && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength <= 2
                      ? "w-1/3 bg-red-400"
                      : strength <= 4
                      ? "w-2/3 bg-amber-400"
                      : "w-full bg-emerald-400"
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Strength:</span>
                <span
                  className={
                    strength <= 2
                      ? "text-red-400"
                      : strength <= 4
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                >
                  {strength <= 2 ? "Weak" : strength <= 4 ? "Medium" : "Strong"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1.5">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 mt-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating Password...
            </>
          ) : (
            <>
              Update Password
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Cancel and return to sign in
        </Link>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-blue-600/20" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[128px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-bold gradient-text">DevBattle</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md"
          >
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Create your new <span className="gradient-text">secure credentials</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Once updated, you&apos;ll be able to immediately sign back in and continue
              tracking your developer metrics and battles.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Password must be at least 8 characters",
                "Includes an uppercase letter and a number",
                "Single-use link automatically invalidated on completion",
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">{rule}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-xs text-muted-foreground">
            © 2026 CodePulse (DevBattle). All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Reset Password View */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}

