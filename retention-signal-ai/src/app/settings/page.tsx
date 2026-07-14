"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, Bell, Shield, Palette, Users, Sparkles, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "organization", label: "Organization", icon: Users },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "notifications", label: "Notification Rules", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "ai-preferences", label: "AI Preferences", icon: Sparkles },
];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? "",
    company_name: user?.company_name ?? "",
    designation: user?.designation ?? "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleProfileSave = async () => {
    if (!profileForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!profileForm.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(profileForm);
    } catch {
      // error handled in updateProfile
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const errors: typeof passwordErrors = {};
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(passwordForm.newPassword)) {
      errors.newPassword = "Must contain an uppercase letter";
    } else if (!/[0-9]/.test(passwordForm.newPassword)) {
      errors.newPassword = "Must contain a number";
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and workspace preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                      {user ? getInitials(user.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="text-xs">Change Avatar</Button>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Company Name</Label>
                    <Input
                      value={profileForm.company_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, company_name: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Designation</Label>
                    <Input
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm((p) => ({ ...p, designation: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Email (read-only)</Label>
                    <Input value={user?.email ?? ""} className="h-9 text-sm" disabled />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Role (read-only)</Label>
                    <Input value={user?.role ?? "Manager"} className="h-9 text-sm" disabled />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setProfileForm({
                      full_name: user?.full_name ?? "",
                      company_name: user?.company_name ?? "",
                      designation: user?.designation ?? "",
                    })}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleProfileSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "workspace" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Workspace Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Workspace Name</Label>
                  <Input defaultValue={user?.company_name ?? "Enterprise"} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Default Timezone</Label>
                  <Select defaultValue="utc-5">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">Pacific (UTC-8)</SelectItem>
                      <SelectItem value="utc-5">Eastern (UTC-5)</SelectItem>
                      <SelectItem value="utc+0">UTC</SelectItem>
                      <SelectItem value="utc+5.5">IST (UTC+5:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="text-xs">Cancel</Button>
                  <Button size="sm" className="text-xs">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <p className="text-xs text-muted-foreground">
                  Enter a new password below. You will remain signed in after the change.
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <Input
                    type="password"
                    className={`h-9 text-sm ${passwordErrors.newPassword ? "border-destructive" : ""}`}
                    value={passwordForm.newPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                      setPasswordErrors((p) => ({ ...p, newPassword: undefined }));
                    }}
                    placeholder="••••••••"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input
                    type="password"
                    className={`h-9 text-sm ${passwordErrors.confirmPassword ? "border-destructive" : ""}`}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => {
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }));
                      setPasswordErrors((p) => ({ ...p, confirmPassword: undefined }));
                    }}
                    placeholder="••••••••"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Enable</Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" className="text-xs" onClick={handlePasswordChange} disabled={isSavingPassword}>
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-xs mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`p-3 rounded-xl border-2 text-center text-sm font-medium capitalize transition-colors ${
                          theme === t
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-xs text-muted-foreground">Reduce spacing throughout the interface</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Risk Alerts", desc: "Get notified when accounts drop below health threshold", defaultChecked: true },
                  { title: "AI Recommendations", desc: "Receive AI-generated recommendations daily", defaultChecked: true },
                  { title: "Task Assignments", desc: "Notifications when tasks are assigned to you", defaultChecked: true },
                  { title: "Contract Renewals", desc: "Reminders for upcoming contract renewals", defaultChecked: true },
                  { title: "Weekly Digest", desc: "Weekly summary of account health changes", defaultChecked: false },
                  { title: "Opportunity Alerts", desc: "Notifications for new upsell/cross-sell opportunities", defaultChecked: false },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" className="text-xs">Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "organization" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Organization Name</Label>
                  <Input defaultValue={user?.company_name ?? ""} className="h-9 text-sm" />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Users & Roles</p>
                  <p className="text-xs text-muted-foreground">Role-based access control will be available in a future release.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" className="text-xs">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Salesforce", desc: "Sync CRM data with account intelligence", connected: true },
                  { name: "HubSpot", desc: "Import marketing and sales pipeline data", connected: false },
                  { name: "Slack", desc: "Send notifications and alerts to Slack channels", connected: true },
                  { name: "Jira", desc: "Sync tasks and project updates", connected: false },
                  { name: "Google Workspace", desc: "Calendar and meeting integration", connected: true },
                  { name: "Microsoft Teams", desc: "Teams notifications and meetings", connected: false },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.desc}</p>
                    </div>
                    <Button variant={integration.connected ? "outline" : "default"} size="sm" className="text-xs">
                      {integration.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "ai-preferences" && (
            <Card>
              <CardHeader><CardTitle className="text-base">AI Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Auto-generate Recommendations", desc: "Let AI automatically generate account recommendations", defaultChecked: true },
                  { title: "Churn Prediction Alerts", desc: "Receive alerts when AI detects churn risk patterns", defaultChecked: true },
                  { title: "Upsell/Cross-sell Detection", desc: "Automatically identify expansion opportunities", defaultChecked: true },
                  { title: "Weekly AI Summary", desc: "Receive weekly AI-generated executive summary", defaultChecked: true },
                  { title: "Sentiment Analysis", desc: "Analyze communication sentiment with clients", defaultChecked: false },
                  { title: "Auto-assign Tasks", desc: "Let AI suggest task assignments based on workload", defaultChecked: false },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" className="text-xs">Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
