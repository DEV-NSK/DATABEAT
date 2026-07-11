"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { clients, managers } from "@/lib/mock-data";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, MoreHorizontal, TrendingDown, TrendingUp, Minus, Search, Download, Upload, Plus, X, Filter } from "lucide-react";
import Link from "next/link";

const CURRENT_TIME = new Date("2026-07-11T12:00:00Z").getTime();

const healthColors = {
  healthy: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  at_risk: "bg-destructive/10 text-destructive",
  critical: "bg-destructive/10 text-destructive",
};

const industries = [...new Set(clients.map(c => c.industry))];
const allServices = [...new Set(clients.flatMap(c => c.services))];

function getTrendIcon(trend: number[]) {
  const recent = trend[trend.length - 1];
  const prev = trend[trend.length - 3];
  if (recent > prev + 3) return <TrendingUp className="w-3.5 h-3.5 text-success" />;
  if (recent < prev - 3) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterManager, setFilterManager] = useState("all");
  const [filterHealth, setFilterHealth] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  const filtered = clients.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterIndustry !== "all" && c.industry !== filterIndustry) return false;
    if (filterManager !== "all" && c.manager.id !== filterManager) return false;
    if (filterHealth !== "all" && c.healthStatus !== filterHealth) return false;
    if (filterService !== "all" && !c.services.includes(filterService)) return false;
    if (filterContract === "expiring" && Math.floor((new Date(c.contractEnd).getTime() - CURRENT_TIME) / (1000 * 60 * 60 * 24)) > 90) return false;
    if (filterContract === "active" && Math.floor((new Date(c.contractEnd).getTime() - CURRENT_TIME) / (1000 * 60 * 60 * 24)) <= 90) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedClients = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeFilters = [filterIndustry, filterManager, filterHealth, filterContract, filterService].filter(f => f !== "all").length;

  const clearFilters = () => {
    setFilterIndustry("all");
    setFilterManager("all");
    setFilterHealth("all");
    setFilterContract("all");
    setFilterService("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor every customer account · {filtered.length} results</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"><Download className="w-3.5 h-3.5" />Export</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1"><Upload className="w-3.5 h-3.5" />Import</Button>
          <Button size="sm" className="h-8 text-xs gap-1"><Plus className="w-3.5 h-3.5" />Add Client</Button>
        </div>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, contacts..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9 h-8 text-sm bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-3.5 h-3.5" /> Filters
          {activeFilters > 0 && <Badge className="ml-1 h-4 min-w-[16px] px-1 text-[9px]">{activeFilters}</Badge>}
        </Button>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearFilters}>
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border">
          <Select value={filterIndustry} onValueChange={v => { setFilterIndustry(v!); setPage(1); }}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterManager} onValueChange={v => { setFilterManager(v!); setPage(1); }}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Manager" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterHealth} onValueChange={v => { setFilterHealth(v!); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Health" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterContract} onValueChange={v => { setFilterContract(v!); setPage(1); }}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Contract" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              <SelectItem value="expiring">Expiring (90d)</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterService} onValueChange={v => { setFilterService(v!); setPage(1); }}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Services" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {allServices.slice(0, 10).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Client</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Industry</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Health Score</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Trend</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Revenue</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Services</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Contract End</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Manager</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16">
                    <p className="text-sm font-medium">No clients found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                    <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={clearFilters}>Clear Filters</Button>
                  </TableCell>
                </TableRow>
              ) : paginatedClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                          {client.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{client.contactPerson}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{client.industry}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            client.healthScore >= 80 ? "bg-success" : client.healthScore >= 60 ? "bg-warning" : "bg-destructive"
                          }`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{client.healthScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTrendIcon(client.trend)}</TableCell>
                  <TableCell className="text-xs font-medium">${(client.revenue / 1000).toFixed(0)}K</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">{client.services[0]}</Badge>
                      {client.services.length > 1 && <Badge variant="outline" className="text-[9px]">+{client.services.length - 1}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{client.contractEnd}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{client.manager.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${healthColors[client.healthStatus]}`}>
                      {client.healthStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
