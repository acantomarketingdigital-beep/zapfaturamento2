"use client";

import { usePathname } from "next/navigation";

const AUTH_PREFIXES = [
  "/login", "/register", "/redefinir", "/nova-senha", "/ativar",
  "/w/", "/g/", "/r/", "/f/", "/s/", "/p/", "/invite/", "/reconectar/",
  "/billing/", "/politica", "/termos",
];

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname === "/" || AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  if (isPublic) return <>{children}</>;
  return (
    <div className="lg:ml-64 pt-14 lg:pt-0 flex min-h-screen flex-col">
      {children}
    </div>
  );
}
