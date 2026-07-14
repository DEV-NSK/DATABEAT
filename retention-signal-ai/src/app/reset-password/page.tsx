"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity, ArrowRight, CheckCircle2, Eye, EyeOff, Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Supabase will automatically parse the hash and establish a session
  // We just need to call updateUser once the user submits the new password
  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is ready, user can now set a new password
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const passwordStrength = getPasswordStrength();

  const validate = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setIsSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update password";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
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

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Password Updated</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
              <Button onClick={() => router.push("/login")} className="gap-2">
                Go to Sign In <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Set New Password</h1>
                <p className="text-sm text-muted-foreground">
                  Create a strong password to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                      }}
                      className={`h-11 pr-10 bg-background ${errors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}

                  {password && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= passwordStrength ? strengthColors[passwordStrength - 1] : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strength: <span className="font-medium">{strengthLabels[passwordStrength - 1] || "Very Weak"}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { label: "8+ characters", check: password.length >= 8 },
                          { label: "Uppercase letter", check: /[A-Z]/.test(password) },
                          { label: "Lowercase letter", check: /[a-z]/.test(password) },
                          { label: "Number", check: /[0-9]/.test(password) },
                          { label: "Special character", check: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                        ].map((req) => (
                          <div key={req.label} className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3 h-3 ${req.check ? "text-green-500" : "text-muted-foreground"}`} />
                            <span className="text-xs text-muted-foreground">{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
                      }}
                      className={`h-11 pr-10 bg-background ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-sm font-semibold gap-2 mt-2"
                >
                  {isSubmitting ? "Updating Password..." : "Update Password"}
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="w-full h-11 text-sm font-medium"
                >
                  Back to Sign In
                </Button>
              </form>
            </>
          )}

          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              © 2026 Retention Signal AI. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right — Illustration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden items-center justify-center"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="relative flex flex-col items-center gap-6 px-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <h2 className="text-2xl font-bold text-white mb-3">Secure your account</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              A strong password protects your workspace and client data from unauthorized access.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 gap-3 w-full max-w-xs"
          >
            {[
              "Minimum 8 characters",
              "Uppercase & lowercase",
              "Numbers required",
              "Special characters",
            ].map((tip) => (
              <div key={tip} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-white/80 text-[11px] font-medium">{tip}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
