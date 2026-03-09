"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ShowStatus } from "@/types";

const config: Record<ShowStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string; dot: string }> = {
  idea: { label: "Idea", variant: "outline", dot: "bg-zinc-400" },
  pitched: { label: "Pitched", variant: "secondary", dot: "bg-zinc-500" },
  hold: { label: "Hold", variant: "default", className: "bg-amber-500 hover:bg-amber-600 text-white", dot: "bg-amber-500" },
  confirmed: { label: "Confirmed", variant: "default", className: "bg-emerald-600 hover:bg-emerald-700 text-white", dot: "bg-emerald-600" },
  advanced: { label: "Advanced", variant: "default", className: "bg-blue-600 hover:bg-blue-700 text-white", dot: "bg-blue-600" },
  played: { label: "Played", variant: "secondary", className: "bg-zinc-500 hover:bg-zinc-600 text-white", dot: "bg-zinc-500" },
  cancelled: { label: "Cancelled", variant: "destructive", dot: "bg-red-500" },
};

const allStatuses: ShowStatus[] = ["idea", "pitched", "hold", "confirmed", "advanced", "played", "cancelled"];

interface ShowStatusBadgeProps {
  status: ShowStatus;
  onStatusChange?: (status: ShowStatus) => void;
}

export function ShowStatusBadge({ status, onStatusChange }: ShowStatusBadgeProps) {
  const c = config[status];

  if (!onStatusChange) {
    return (
      <Badge variant={c.variant} className={c.className}>
        {c.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 focus:outline-none cursor-pointer bg-transparent border-0 p-0">
        <Badge variant={c.variant} className={c.className}>
          {c.label}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {allStatuses.map((s) => {
          const sc = config[s];
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => onStatusChange(s)}
              className={s === status ? "font-semibold" : ""}
            >
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${sc.dot}`} />
              {sc.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
