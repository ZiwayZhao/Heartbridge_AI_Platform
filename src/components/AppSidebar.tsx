
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
} from "@/components/ui/sidebar";
import { Home, BookOpen, Users, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";

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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">心桥 HeartBridge</span>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className={location.pathname === item.url ? "bg-primary/10" : ""}>
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
                  <SidebarMenuItem key={item.title} className={location.pathname === item.url ? "bg-primary/10" : ""}>
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
