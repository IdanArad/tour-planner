"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ReachoutStatus } from "@/types";

const config: Record<ReachoutStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string; dot: string }> = {
  drafted: { label: "Drafted", variant: "outline", dot: "bg-zinc-400" },
  sent: { label: "Sent", variant: "secondary", className: "bg-sky-100 text-sky-800 hover:bg-sky-200", dot: "bg-sky-500" },
  replied: { label: "Replied", variant: "default", className: "bg-emerald-600 hover:bg-emerald-700 text-white", dot: "bg-emerald-600" },
  follow_up: { label: "Follow Up", variant: "default", className: "bg-amber-500 hover:bg-amber-600 text-white", dot: "bg-amber-500" },
  no_response: { label: "No Response", variant: "secondary", className: "bg-zinc-400 text-white hover:bg-zinc-500", dot: "bg-zinc-400" },
  declined: { label: "Declined", variant: "destructive", dot: "bg-red-500" },
  booked: { label: "Booked", variant: "default", className: "bg-violet-600 hover:bg-violet-700 text-white", dot: "bg-violet-600" },
};

const allStatuses: ReachoutStatus[] = ["drafted", "sent", "replied", "follow_up", "no_response", "declined", "booked"];

interface ReachoutStatusBadgeProps {
  status: ReachoutStatus;
  onStatusChange?: (status: ReachoutStatus) => void;
}

export function ReachoutStatusBadge({ status, onStatusChange }: ReachoutStatusBadgeProps) {
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
