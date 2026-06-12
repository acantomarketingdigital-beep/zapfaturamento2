"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItemData = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

export type NavGroupData = {
  section: string;
  items: NavItemData[];
};

type Props = {
  navGroups: NavGroupData[];
  userEmail: string;
  userName: string | null;
  userRole: string;
  databaseReady: boolean;
};

function initials(name: string | null, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function SidebarClient({
  navGroups,
  userEmail,
  userName,
  userRole,
  databaseReady,
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAuth =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/redefinir") ||
    pathname.startsWith("/nova-senha") ||
    pathname.startsWith("/ativar") ||
    pathname.startsWith("/w/") ||
    pathname.startsWith("/g/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/reconectar/") ||
    pathname.startsWith("/billing/") ||
    pathname.startsWith("/politica") ||
    pathname.startsWith("/termos");

  if (isAuth) return null;

  const avatarText = initials(userName, userEmail);
  const displayName = userName ?? userEmail;

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800/60 bg-[#080f1e]">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <Image
          src="/images/kreo-logo.png"
          alt="WHATS KREO"
          width={220}
          height={52}
          className="object-contain h-12 w-full"
          priority
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden text-slate-600 hover:text-slate-400 ml-2 p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Product badge */}
      <div className="px-4 py-2.5 border-b border-slate-800/60">
        <div className="flex items-center gap-2 rounded-lg bg-cyan-400/5 border border-cyan-400/10 px-3 py-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-cyan-400 tracking-widest uppercase">
            WHATS KREO
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.section}>
            <p className="px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700 mb-1.5">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-cyan-400/8 text-cyan-400 border border-cyan-400/15 shadow-[0_0_12px_rgba(34,211,238,0.08)]"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors flex items-center justify-center",
                        isActive
                          ? "text-cyan-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-bold bg-cyan-400 text-[#020817] rounded px-1.5 py-0.5 shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {isActive && !item.badge && (
                      <ChevronRight className="h-3 w-3 text-cyan-500/60 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* DB status */}
      <div className="px-4 pb-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span
            className={cn(
              "flex h-1.5 w-1.5 rounded-full shrink-0",
              databaseReady
                ? "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                : "bg-slate-600"
            )}
          />
          <span className="text-[10px] text-slate-600">
            {databaseReady ? "Banco conectado" : "Banco não configurado"}
          </span>
        </div>
      </div>

      {/* User + logout */}
      <div className="border-t border-slate-800/60 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white shrink-0">
            {avatarText}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#080f1e]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-600 truncate">
              {userRole === "agency_admin" ? "Agency Admin" : "Client User"}
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sair"
              className="text-slate-600 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible ≥ lg */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64">
        {sidebarContent}
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-[#080f1e] border-b border-slate-800/60 px-4 h-14">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-slate-400 hover:text-slate-200 p-1"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image
          src="/images/kreo-logo.png"
          alt="WHATS KREO"
          width={160}
          height={36}
          className="object-contain h-9 w-auto"
          priority
        />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full">{sidebarContent}</div>
          <div
            className="flex-1 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
