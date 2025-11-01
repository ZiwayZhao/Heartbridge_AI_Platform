
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home, BookOpen, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import FireLogo from "./FireLogo";

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const items = [
    {
      title: "首页",
      url: "/",
      icon: Home,
    },
    {
      title: "BCBA咨询师",
      url: "/consultants",
      icon: Users,
    },
  ];

  const adminItems = [
    {
      title: "知识库管理",
      url: "/knowledge",
      icon: BookOpen,
    },
    {
      title: "咨询师管理",
      url: "/bcba-management",
      icon: Users,
    },
  ];
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center h-16 p-4 border-b border-border gap-2">
        <FireLogo size={30} className="drop-shadow" />
        <span className="text-lg font-bold tracking-wide text-orange-600 dark:text-orange-300">聚火盆</span>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className={location.pathname === item.url ? "bg-orange-100 dark:bg-orange-900/60" : ""}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className="flex items-center gap-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>管理员</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title} className={location.pathname === item.url ? "bg-orange-100 dark:bg-orange-900/60" : ""}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className="flex items-center gap-2"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2 text-xs text-muted-foreground">
        Powered by Lovable
      </SidebarFooter>
    </Sidebar>
  );
}
