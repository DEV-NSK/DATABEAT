"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Eye, Trash2, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadHistoryEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface UploadHistoryProps {
  entries: UploadHistoryEntry[];
  onView?: (entry: UploadHistoryEntry) => void;
  onDelete?: (id: string) => void;
}

const statusBadge = {
  completed: "bg-success/10 text-success",
  processing: "bg-primary/10 text-primary",
  error: "bg-destructive/10 text-destructive",
};

export function UploadHistory({ entries, onView, onDelete }: UploadHistoryProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Upload History</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{entries.length} reports uploaded</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-muted-foreground">Upload Date</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Reporting Period</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Filename</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, idx) => (
            <motion.tr
              key={entry.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="hover:bg-muted/30"
            >
              <TableCell>
                <span className="text-xs font-medium">{entry.uploadDate}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">{entry.reportingPeriod}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium">{entry.fileName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("text-[10px]", statusBadge[entry.status])}>
                  {entry.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onView?.(entry)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete?.(entry.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
