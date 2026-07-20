import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  FileText,
  PackageSearch,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/budgets", label: "Orçamentos", icon: FileText },
  { href: "/products", label: "Catálogo", icon: PackageSearch },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/80 lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-sidebar-border/50 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              AM
            </div>
            <span className="text-lg font-bold tracking-tight">Alicerce</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="flex flex-col gap-1">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Gestão
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/50",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 rounded-md p-2 bg-sidebar-accent/30">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs border border-sidebar-primary/30">
              US
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Usuário</span>
              <span className="text-xs text-sidebar-foreground/50 mt-1">
                Operador
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function Topbar({
  setMobileOpen,
}: {
  setMobileOpen: (open: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Sistema Operacional
        </div>
      </div>
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-auto bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
