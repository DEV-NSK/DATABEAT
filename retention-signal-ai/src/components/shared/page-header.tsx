"use client";

import { Search, Download, Upload, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description: string;
  searchPlaceholder?: string;
  showExport?: boolean;
  showImport?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, searchPlaceholder = "Search...", showExport = true, showImport = false, children }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        {children}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={searchPlaceholder} className="pl-9 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </Button>
        {showExport && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        )}
        {showImport && (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" />
            Import
          </Button>
        )}
      </div>
    </div>
  );
}
