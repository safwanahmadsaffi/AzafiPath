import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { Compass, LayoutDashboard, LogIn, LogOut, PanelLeft, Route, Sparkles, WalletCards } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: Route, label: "Life roadmap", id: "roadmap" },
  { icon: WalletCards, label: "Investments", id: "investments" },
  { icon: Compass, label: "Habits & goals", id: "habits" },
];

const SIDEBAR_WIDTH_KEY = "azadipath-sidebar-width";
const DEFAULT_WIDTH = 264;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState(() => window.location.hash.replace("#", "") || "overview");

  useEffect(() => {
    const onHashChange = () => setActiveId(window.location.hash.replace("#", "") || "overview");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = event.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const jumpTo = (id: string) => {
    window.history.replaceState(null, "", `/#${id}`);
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-[88px] justify-center px-4">
            <div className="flex w-full items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B7E45C] text-[#063D2A] transition-transform hover:-rotate-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7E45C] active:scale-95"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold tracking-[-0.04em] text-white">AzadiPath</p>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B7E45C]">Pakistan @ 79</p>
                </div>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-0 px-3 py-4">
            <div className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Your command room</div>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const active = activeId === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={active}
                      onClick={() => jumpTo(item.id)}
                      tooltip={item.label}
                      className="h-11 rounded-xl font-medium text-white/70 hover:bg-white/10 hover:text-white data-[active=true]:bg-[#0F8A55] data-[active=true]:text-white"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            {!isCollapsed && (
              <div className="mt-auto px-3 pt-10">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Sparkles className="mb-3 h-4 w-4 text-[#B7E45C]" />
                  <p className="text-xs font-semibold leading-5 text-white">Start early. Build boldly.</p>
                  <p className="mt-1 text-[11px] leading-4 text-white/55">Your future is a national asset.</p>
                </div>
              </div>
            )}
          </SidebarContent>
          <SidebarFooter className="p-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7E45C] group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-9 w-9 border border-white/15 bg-[#B7E45C]">
                      <AvatarFallback className="bg-[#B7E45C] text-xs font-bold text-[#063D2A]">{user.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                      <p className="truncate text-sm font-medium leading-none text-white">{user.name || "Pathfinder"}</p>
                      <p className="mt-1.5 truncate text-xs text-white/45">{user.email || "Signed in"}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => startLogin()} variant="ghost" className="w-full justify-start gap-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white group-data-[collapsible=icon]:justify-center" aria-label="Sign in">
                <LogIn className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Sign in to save</span>
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[#B7E45C]/30 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} />
      </div>
      <SidebarInset>
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#D5E5D6] bg-[#F8FBF4]/95 px-3 backdrop-blur">
            <div className="flex items-center gap-2"><SidebarTrigger className="h-9 w-9 rounded-xl bg-[#EAF4E8]" /><span className="font-display text-sm font-bold text-[#123328]">{menuItems.find((item) => item.id === activeId)?.label || "Overview"}</span></div>
            <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[#0F8A55]">PK @ 79</span>
          </div>
        )}
        <main id="main-content" className="min-h-screen flex-1">{children}</main>
      </SidebarInset>
    </>
  );
}
