import React from "react";
import {
  LayoutDashboard,
  BookText,
  BarChart3,
  Heart,
  Settings,
  PlusCircle,
  Sparkles
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
export function AppSidebar(): JSX.Element {
  const journals = useAppStore((s) => s.journals);
  const location = useLocation();
  return (
    <Sidebar className="border-r border-stone-200 dark:border-stone-800">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3 px-2 group">
          <div className="h-8 w-8 rounded-lg bg-stone-900 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Lumina</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/dashboard"}>
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="opacity-50" />
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium uppercase tracking-wider text-stone-500">
            Journals
          </SidebarGroupLabel>
          <SidebarMenu className="mt-2">
            {journals.map((journal) => (
              <SidebarMenuItem key={journal.id}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === `/journal/${journal.id}`}
                >
                  <Link to={`/journal/${journal.id}`} className="flex items-center gap-3">
                    <BookText className="size-4" />
                    <span className="truncate">{journal.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium uppercase tracking-wider text-stone-500">
            Analytics & Legacy
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/insights"}>
                <Link to="/insights">
                  <BarChart3 className="size-4" />
                  <span>Insights</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/legacy"}>
                <Link to="/legacy">
                  <Heart className="size-4" />
                  <span>Legacy Plan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full justify-start gap-3 bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 hover:bg-stone-200">
              <Link to="/dashboard">
                <PlusCircle className="size-4 text-stone-600" />
                <span className="font-medium text-stone-900 dark:text-stone-100">Manage Hub</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="mt-2 text-stone-500">
              <a href="#"><Settings className="size-4" /> <span>Settings</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}