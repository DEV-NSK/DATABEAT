"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Activity, ArrowRight, Shield, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, resetPassword, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch (error) {
      // Error is handled in the signIn function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setShowForgotPassword(false);
    } catch (error) {
      // Error is handled in the resetPassword function
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-8 lg:px-16 bg-card"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-tight">Retention Signal AI</h2>
              <p className="text-[11px] text-muted-foreground">Account Intelligence Platform</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {showForgotPassword ? "Reset Password" : "Welcome Back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {showForgotPassword 
                ? "Enter your email to receive a password reset link."
                : "Sign in to continue to your workspace."
              }
            </p>
          </div>

          {/* Form */}
          {!showForgotPassword ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background border-border focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background border-border focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me</Label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-2"
              >
                {isSubmitting || loading ? "Signing in..." : "Sign In"}
                {!isSubmitting && !loading && <ArrowRight className="w-4 h-4" />}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Register Link */}
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/register")}
                className="w-full h-11 text-sm font-medium border-border hover:bg-muted"
              >
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-background border-border focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isSubmitting || loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full h-11 text-sm font-medium"
              >
                Back to Sign In
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              © 2026 Retention Signal AI. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right - Illustration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden items-center justify-center"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        </div>

        {/* Floating cards - Abstract dashboard visualization */}
        <div className="relative w-[480px] h-[560px]">
          {/* Main dashboard card */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-8 left-8 w-[340px] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Account Health</p>
                <p className="text-white/60 text-[10px]">Real-time monitoring</p>
              </div>
            </div>
            {/* Mini chart bars */}
            <div className="flex items-end gap-1.5 h-20 mb-4">
              {[65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 88, 72].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
                  className="flex-1 rounded-t-sm"
                  style={{ backgroundColor: h > 70 ? "rgba(16,185,129,0.8)" : h > 50 ? "rgba(245,158,11,0.8)" : "rgba(239,68,68,0.8)" }}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Healthy", val: "23", color: "bg-emerald-400" },
                { label: "Warning", val: "12", color: "bg-amber-400" },
                { label: "Critical", val: "5", color: "bg-red-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 rounded-lg p-2.5 text-center">
                  <div className={`w-2 h-2 rounded-full ${s.color} mx-auto mb-1`} />
                  <p className="text-white text-lg font-bold">{s.val}</p>
                  <p className="text-white/60 text-[9px]">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Insight card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="absolute top-64 right-0 w-[220px] bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <p className="text-white text-xs font-semibold">AI Insight</p>
            </div>
            <p className="text-white/80 text-[10px] leading-relaxed mb-3">
              3 accounts show declining engagement patterns. Recommend executive outreach.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-amber-400 rounded-full" />
              </div>
              <span className="text-[9px] text-white/60">89%</span>
            </div>
          </motion.div>

          {/* Revenue card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-20 left-0 w-[200px] bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <p className="text-white text-xs font-semibold">Revenue Opportunity</p>
            </div>
            <p className="text-white text-2xl font-bold">$245K</p>
            <p className="text-white/60 text-[10px] mt-1">12 opportunities detected</p>
          </motion.div>

          {/* Shield badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.1, type: "spring" }}
            className="absolute bottom-8 right-16 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg"
          >
            <Shield className="w-6 h-6 text-white" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
