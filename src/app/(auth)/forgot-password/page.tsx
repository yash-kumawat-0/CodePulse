"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  KeyRound,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Flame,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { createPasswordResetRequest } from "@/lib/password-reset-store";
import { isEmailRegistered } from "@/lib/auth-store";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [unregisteredError, setUnregisteredError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Handle resend timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submittedEmail && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [submittedEmail, resendCountdown]);

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setUnregisteredError(null);

    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Check if email is registered
      if (!isEmailRegistered(data.email)) {
        setIsLoading(false);
        const errMsg = "This email is not registered with any DevBattle account.";
        setUnregisteredError(errMsg);
        toast.error("Email not found", {
          description: "No account exists with this email address. Please check your spelling or sign up.",
        });
        return;
      }

      const result = createPasswordResetRequest(data.email);
      setGeneratedToken(result.token);
      setSubmittedEmail(data.email);
      setResendCountdown(60);
      setCanResend(false);

      toast.success("Reset link sent!", {
        description: `Recovery instructions sent to ${data.email}`,
      });
    } catch {
      toast.error("Failed to process request", {
        description: "Please check your email address and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail || !canResend) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const result = createPasswordResetRequest(submittedEmail);
    setGeneratedToken(result.token);
    setResendCountdown(60);
    setCanResend(false);
    setIsLoading(false);

    toast.success("New reset link sent!", {
      description: `A fresh link has been issued for ${submittedEmail}`,
    });
  };

  const handleSelectDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setUnregisteredError(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding & Security Highlights */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-indigo-600/20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[128px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold gradient-text">DevBattle</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                by CodePulse
              </span>
            </div>
          </Link>

          {/* Center content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Self-Service Recovery
              </span>
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Recover your account,{" "}
              <span className="gradient-text">keep your streak alive.</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Forgot your credentials? We&apos;ll send you a secure, time-limited
              recovery link so you can get back to coding and climbing the leaderboard.
            </p>

            {/* Security feature cards */}
            <div className="mt-8 space-y-3">
              {[
                {
                  icon: Clock,
                  title: "15-Minute Token Expiry",
                  desc: "Automated expiration ensures outdated recovery requests cannot be replayed.",
                  color: "text-blue-400",
                },
                {
                  icon: ShieldCheck,
                  title: "Single-Use Secure Link",
                  desc: "Direct cryptographic token that invalidates immediately once the new password is set.",
                  color: "text-purple-400",
                },
                {
                  icon: KeyRound,
                  title: "Zero-Knowledge Protection",
                  desc: "Your GitHub telemetry, battle elo, and personal data remain fully shielded.",
                  color: "text-emerald-400",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4 flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Streak retention note */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/20"
            >
              <Flame className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground font-semibold">Active Streak Preserved:</strong>{" "}
                Resetting your password will not interrupt active battle records or stats.
              </span>
            </motion.div>
          </motion.div>

          <div className="text-xs text-muted-foreground">
            © 2026 CodePulse (DevBattle). All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Forgot Password Form / Confirmation Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold gradient-text">DevBattle</span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {!submittedEmail ? (
              /* STATE 1: Enter Email Form */
              <motion.div
                key="request-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                  <KeyRound className="w-6 h-6 text-purple-400" />
                </div>

                <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground mb-6 text-sm">
                  Enter your registered account email and we&apos;ll send
                  you secure instructions to reset your password.
                </p>

                {/* Unregistered Email Alert */}
                {unregisteredError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-medium">{unregisteredError}</p>
                      <Link
                        href="/signup"
                        className="underline font-semibold mt-1 inline-block text-amber-300 hover:text-amber-200"
                      >
                        Don&apos;t have an account? Sign up here →
                      </Link>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        {...register("email")}
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.email.message}
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
                        Verifying & sending link...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Quick Registered Accounts Selector */}
                <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      Sample Registered Accounts
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectDemo("developer@github.com")}
                      className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-center border border-white/5 font-mono truncate"
                    >
                      developer@github.com
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDemo("demo@devbattle.com")}
                      className="flex-1 text-[11px] py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors text-center border border-white/5 font-mono truncate"
                    >
                      demo@devbattle.com
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* STATE 2: Confirmation / Success State */
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Success Icon */}
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2">Check Your Inbox</h1>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We&apos;ve dispatched a secure password-reset link to:
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-foreground font-mono">
                    {submittedEmail}
                  </div>
                </div>

                {/* Token Expiry Box */}
                <div className="glass-card rounded-2xl p-4 space-y-2 border border-purple-500/20">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      Link Expiry:
                    </span>
                    <span className="text-purple-300 font-semibold">15:00 minutes</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-full animate-pulse" />
                  </div>
                </div>

                {/* Direct Demo Link to Test Reset Password */}
                {generatedToken && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-left space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        <KeyRound className="w-3 h-3 text-purple-400" />
                        Direct Reset Link (Demo):
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click below to immediately test the dedicated password reset page:
                    </p>
                    <Link
                      href={`/reset-password?token=${generatedToken}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                    >
                      <span>Proceed to Reset Password Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                )}

                {/* Resend actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">
                      Didn&apos;t receive the email?
                    </span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isLoading}
                        className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                        />
                        Resend now
                      </button>
                    ) : (
                      <span className="text-muted-foreground font-mono">
                        Resend in {resendCountdown}s
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground/80 bg-white/5 p-3 rounded-xl border border-white/5">
                    <strong>Tip:</strong> If you don&apos;t see the email within a couple of
                    minutes, check your spam or junk folder, or verify you typed the correct
                    email address.
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedEmail(null);
                      setGeneratedToken(null);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change email address
                  </button>
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
