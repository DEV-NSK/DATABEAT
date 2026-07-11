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
  const [activeTab, setActiveTab] = useState("profile");

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
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">SK</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="text-xs">Change Avatar</Button>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name</Label>
                    <Input defaultValue="Sai" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name</Label>
                    <Input defaultValue="Kiran" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input defaultValue="sai.kiran@company.com" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input defaultValue="+1 (555) 123-4567" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Role</Label>
                    <Input defaultValue="Director" className="h-9 text-sm" disabled />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" className="text-xs">Cancel</Button>
                  <Button size="sm" className="text-xs">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "workspace" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workspace Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Workspace Name</Label>
                  <Input defaultValue="Enterprise" className="h-9 text-sm" />
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

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
              </CardHeader>
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

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <Input type="password" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" className="h-9 text-sm" />
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
                  <Button size="sm" className="text-xs">Update Password</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-xs mb-3 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Light", "Dark", "System"].map((theme) => (
                      <button key={theme} className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-colors ${
                        theme === "Light" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}>
                        {theme}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sidebar Collapsed by Default</p>
                    <p className="text-xs text-muted-foreground">Start with a collapsed sidebar</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "organization" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-xs">Organization Name</Label>
                  <Input defaultValue="DataBeat Enterprise" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Organization URL</Label>
                  <Input defaultValue="databeat.retentionsignal.ai" className="h-9 text-sm" />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Users & Roles</p>
                  <div className="space-y-2">
                    {["Sai Kiran - Director", "Sarah Chen - Sr. Account Manager", "James Wilson - Account Manager"].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium">{user}</p>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]">Manage</Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs mt-3">Invite User</Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" className="text-xs">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrations</CardTitle>
              </CardHeader>
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
              <CardHeader>
                <CardTitle className="text-base">AI Preferences</CardTitle>
              </CardHeader>
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
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs">AI Confidence Threshold</Label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={50} max={95} defaultValue={70} className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                    <span className="text-sm font-semibold">70%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Only show recommendations above this confidence level</p>
                </div>
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
