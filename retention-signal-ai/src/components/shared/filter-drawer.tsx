"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  onApply: () => void;
  onReset: () => void;
  savedFilters?: { label: string; count: number }[];
}

export function FilterDrawer({ open, onClose, groups, onApply, onReset, savedFilters }: FilterDrawerProps) {
  const totalActive = groups.reduce((acc, g) => acc + g.selected.length, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-[360px] bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Filters</h3>
                {totalActive > 0 && (
                  <Badge className="h-5 min-w-[20px] text-[10px] bg-primary text-primary-foreground">{totalActive}</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {savedFilters && savedFilters.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saved Filters</p>
                  <div className="space-y-1">
                    {savedFilters.map((sf) => (
                      <button key={sf.label} className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg hover:bg-muted">
                        <span className="font-medium">{sf.label}</span>
                        <Badge variant="outline" className="text-[10px]">{sf.count}</Badge>
                      </button>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              )}

              {groups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-medium text-foreground mb-2">{group.label}</p>
                  <div className="space-y-1">
                    {group.options.map((option) => {
                      const isSelected = group.selected.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            const next = isSelected
                              ? group.selected.filter(s => s !== option.value)
                              : [...group.selected, option.value];
                            group.onChange(next);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? "bg-primary border-primary" : "border-border"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          {option.count !== undefined && (
                            <span className="text-[10px] text-muted-foreground">{option.count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-3 border-t border-border flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onReset}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
                <Button size="sm" className="text-xs" onClick={() => { onApply(); onClose(); }}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
