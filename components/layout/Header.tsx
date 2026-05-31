"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, LogOut, User } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../../components/ui/Button";
import { Tooltip } from "../../components/ui/Tooltip";

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
  const router   = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 bg-dark-900/80 backdrop-blur-md border-b
                       border-dark-800 flex items-center px-6 gap-4
                       sticky top-0 z-30">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center
                        justify-center shadow-glow-sm">
          <Database className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-dark-50 tracking-tight">
          ERD Builder
        </span>
      </Link>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        {userEmail && (
          <Tooltip content={userEmail} side="bottom">
            <button className="w-9 h-9 rounded-lg flex items-center
                               justify-center hover:bg-dark-700
                               text-dark-400 hover:text-dark-200
                               transition-all duration-200">
              <User className="w-4 h-4" />
            </button>
          </Tooltip>
        )}

        <Tooltip content="Sign out" side="bottom">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-9 h-9 p-0"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}