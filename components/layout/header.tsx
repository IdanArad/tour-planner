"use client";

import { LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { signOut } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  const { state } = useStore();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold">{state.artist.name}</h2>
        {state.artist.genre && (
          <Badge variant="secondary" className="text-xs font-normal">
            {state.artist.genre}
          </Badge>
        )}
      </div>
      <form action={signOut}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Sign out
        </Button>
      </form>
    </header>
  );
}
