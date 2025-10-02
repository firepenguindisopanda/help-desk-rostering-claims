"use client";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  LogOut,
  Menu,
  X,
  Calendar,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { routes } from "@/lib/routes";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: routes.admin.index, icon: BarChart3 },
    { name: "Schedule", href: routes.admin.schedule, icon: Calendar },
    { name: "Performance", href: routes.admin.performance, icon: TrendingUp },
    { name: "Profile", href: "/admin/profile", icon: Settings },
    { name: "Time Tracking", href: "#soon:time", icon: Users },
    { name: "Staff Reports", href: "#soon:reports", icon: Shield },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 bg-black/20"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setSidebarOpen(false);
            }
          }}
          style={{ cursor: "pointer" }}
        />
        <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold text-primary">Schedule Admin</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={(item.href.startsWith("#soon") ? "#" : (item.href as any))}
                className={cn(
                  "flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                  !item.href.startsWith("#soon") && pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                )}
                onClick={() => {
                  if (item.href.startsWith("#soon")) {
                    toast.info("Coming soon");
                    return;
                  }
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-card border-r border-border">
          <div className="flex h-16 items-center px-6">
            <h1 className="text-xl font-bold text-primary">Schedule Admin</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2 pb-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={(item.href.startsWith("#soon") ? "#" : (item.href as any))}
                className={cn(
                  "flex items-center px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                  !item.href.startsWith("#soon") && pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                )}
                onClick={(e) => {
                  if (item.href.startsWith("#soon")) {
                    e.preventDefault();
                    toast.info("Coming soon");
                  }
                }}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ModeToggle />
              
              {/* User menu */}
              <div className="flex items-center gap-x-2">
                <div className="hidden sm:flex sm:flex-col sm:items-end sm:leading-tight">
                  <div className="text-sm font-medium">{user?.name || user?.username || user?.email}</div>
                  <div className="text-xs text-muted-foreground">Administrator • {user?.role}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}