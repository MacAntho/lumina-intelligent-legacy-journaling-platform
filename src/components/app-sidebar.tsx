import React from "react";
import {
  LayoutDashboard,
  BookText,
  BarChart3,
  Heart,
  Settings,
  Sparkles,
  User as UserIcon,
  LogOut,
  BrainCircuit
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
export function AppSidebar(): JSX.Element {
  const journals = useAppStore(s => s.journals);
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };
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
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/ai-assistant"}>
                <Link to="/ai-assistant" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="size-4 text-amber-500" />
                    <span>AI Assistant</span>
                  </div>
                  <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-100">BETA</Badge>
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
      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/profile"} className="p-2 h-auto">
              <Link to="/profile" className="flex items-center gap-3">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="rounded-lg bg-stone-200 text-stone-600">
                    {user?.name?.[0] || <UserIcon size={14} />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-xs">
                  <span className="font-medium text-stone-900 dark:text-stone-100 truncate max-w-[120px]">{user?.name}</span>
                  <span className="text-stone-400">View Profile</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-stone-500 hover:text-red-500 transition-colors">
              <LogOut className="size-4" /> <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-stone-500">
              <a href="#"><Settings className="size-4" /> <span>Settings</span></a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}