"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Users, Camera } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, manager, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.full_name ?? "");

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ full_name: displayName.trim() });
    } catch {
      // error handled in updateProfile
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your Team Lead profile and account information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                  {user ? getInitials(user.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm border-2 border-background"
                title="Change profile photo"
                onClick={() => toast.info("Profile photo upload coming soon")}
              >
                <Camera className="w-3 h-3 text-primary-foreground" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user?.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
              <Badge variant="outline" className="text-[10px] mt-1 bg-primary/10 text-primary border-primary/20">
                Team Lead
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Editable Information</h3>

            <div className="space-y-1.5">
              <Label className="text-xs">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-9 text-sm"
                placeholder="Your full name"
              />
            </div>
          </div>

          <Separator />

          {/* Read-Only Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Read-Only Information</h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm text-foreground">{user?.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Role</p>
                  <p className="text-sm text-foreground capitalize">
                    {user?.role === "team_lead" ? "Team Lead" : (user?.role || "Team Lead")}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] bg-muted text-muted-foreground">
                  Read Only
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Manager</p>
                  <p className="text-sm text-foreground">
                    {manager?.full_name || "Not assigned"}
                  </p>
                  {manager?.email && (
                    <p className="text-[10px] text-muted-foreground">{manager.email}</p>
                  )}
                </div>
                <Badge variant="outline" className="ml-auto text-[10px] bg-muted text-muted-foreground">
                  Read Only
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setDisplayName(user?.full_name ?? "")}
            >
              Cancel
            </Button>
            <Button size="sm" className="text-xs" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
