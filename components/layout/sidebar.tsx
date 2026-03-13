"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, MapPin, Mail, Music, Compass, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shows", label: "Shows", icon: Calendar },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/reachouts", label: "Reachouts", icon: Mail },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/email", label: "Email", icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
          <Music className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold tracking-tight">Tour Planner</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-medium transition-all duration-200",
                isActive
                  ? "bg-linear-to-r from-violet-500/15 to-indigo-500/10 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-violet-400")} />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4">
        <p className="text-xs text-muted-foreground/60">v0.1.0</p>
      </div>
    </aside>
  );
}
