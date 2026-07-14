"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, ArrowRight, Shield, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    designation: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Company Name
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    // Designation (optional)
    if (formData.designation && formData.designation.trim().length < 2) {
      newErrors.designation = "Designation must be at least 2 characters";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({
        fullName: formData.fullName.trim(),
        companyName: formData.companyName.trim(),
        designation: formData.designation.trim() || undefined,
        email: formData.email.trim(),
        password: formData.password,
      });

      // If auto-confirmed (session available immediately) → go to dashboard.
      // If email verification needed → go to login with a message.
      // The signUp function in auth-context handles both cases via toast.
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      // Error is handled in the signUp function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  return (
    <div className="min-h-screen flex">
      {/* Left - Registration Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center px-8 lg:px-16 bg-card"
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-tight">Retention Signal AI</h2>
              <p className="text-[11px] text-muted-foreground">Account Intelligence Platform</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-sm text-muted-foreground">Start monitoring your client health with AI-powered insights.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.fullName ? "border-destructive" : ""}`}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="Acme Corporation"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.companyName ? "border-destructive" : ""}`}
              />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation" className="text-sm font-medium text-foreground">
                Designation <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="designation"
                placeholder="Account Manager"
                value={formData.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.designation ? "border-destructive" : ""}`}
              />
              {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
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
                    Password strength: <span className="font-medium">{strengthLabels[passwordStrength - 1] || "Very Weak"}</span>
                  </p>
                </div>
              )}

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-muted-foreground">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { label: "8+ characters", check: formData.password.length >= 8 },
                      { label: "Uppercase letter", check: /[A-Z]/.test(formData.password) },
                      { label: "Lowercase letter", check: /[a-z]/.test(formData.password) },
                      { label: "Number", check: /[0-9]/.test(formData.password) },
                      { label: "Special character", check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-3 h-3 ${req.check ? "text-green-500" : "text-muted-foreground"}`}
                        />
                        <span className="text-xs text-muted-foreground">{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`h-11 bg-background border-border focus-visible:ring-primary ${errors.confirmPassword ? "border-destructive" : ""}`}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-card text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full h-11 text-sm font-medium border-border hover:bg-muted"
            >
              Sign In Instead
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
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
