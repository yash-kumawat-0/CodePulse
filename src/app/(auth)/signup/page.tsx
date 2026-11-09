"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { toast } from "sonner";
import { registerUserAccount } from "@/lib/auth-store";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

const steps = [
  { id: 1, title: "Create Account", description: "Enter your details" },
  { id: 2, title: "Connect GitHub", description: "Link your profile" },
  { id: 3, title: "Personalize", description: "Set your preferences" },
];

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [cachedData, setCachedData] = useState<SignupForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const interests = [
    "Frontend", "Backend", "Full-Stack", "DevOps", "ML/AI",
    "Mobile", "Systems", "Open Source", "Security", "Data",
  ];

  const onSubmit = async (data: SignupForm) => {
    setCachedData(data);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }
    await handleCompleteRegistration(data);
  };

  const handleCompleteRegistration = async (dataToRegister?: SignupForm) => {
    const data = dataToRegister || cachedData;
    if (!data) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = registerUserAccount({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);

    if (!result.success) {
      toast.error("Registration failed", {
        description: result.error || "Could not register account.",
      });
      return;
    }

    toast.success("Account created!", {
      description: `Welcome to DevBattle, ${data.name}! Redirecting...`,
    });

    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

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
            transition={{ delay: 0.3 }}
            className="max-w-md"
          >
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Start your{" "}
              <span className="gradient-text">coding journey</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Join 250,000+ developers who are tracking their growth,
              competing in challenges, and leveling up their skills.
            </p>

            {/* Features */}
            <div className="mt-8 space-y-4">
              {[
                "Beautiful analytics & contribution heatmaps",
                "Compete with developers worldwide",
                "Earn achievements & climb leaderboards",
                "Spotify Wrapped-style developer replays",
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="text-xs text-muted-foreground">
            © 2026 CodePulse (DevBattle). All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="w-full max-w-md"
        >
          {/* Progress steps */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    currentStep >= step.id
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Account Details */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h1 className="text-3xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground mb-8">
                Enter your details to get started
              </p>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-colors mb-6"
              >
                <GithubIcon className="w-5 h-5" />
                Continue with GitHub
              </motion.button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      {...register("name")}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-400 mt-1.5">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
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
                  {errors.password && <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword.message}</p>}
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg shadow-purple-500/20"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Connect GitHub */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold mb-2">Connect GitHub</h1>
              <p className="text-muted-foreground mb-8">
                Link your GitHub account to start tracking your journey
              </p>

              <div className="glass-card rounded-2xl p-8 text-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
                  <GithubIcon className="w-10 h-10" />
                </div>
                <h3 className="font-semibold mb-2">GitHub Authorization</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  We&apos;ll access your public profile, repositories, and contribution data.
                  We never modify your code or settings.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 rounded-xl bg-white text-black font-medium inline-flex items-center gap-2"
                >
                  <GithubIcon className="w-5 h-5" />
                  Authorize GitHub
                </motion.button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold mb-2">Your interests</h1>
              <p className="text-muted-foreground mb-8">
                Select what you&apos;re passionate about
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {interests.map((interest) => (
                  <motion.button
                    key={interest}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedInterests((prev) =>
                        prev.includes(interest)
                          ? prev.filter((i) => i !== interest)
                          : [...prev, interest]
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                        : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={isLoading}
                  onClick={() => handleCompleteRegistration()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
