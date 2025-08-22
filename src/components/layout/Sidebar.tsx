import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Briefcase, 
  TrendingUp,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  BarChart3,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    current: true,
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: ShoppingCart,
    current: false,
  },
  {
    name: "My Invoices",
    href: "/invoices",
    icon: FileText,
    current: false,
    badge: "3",
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
    current: false,
  },
  {
    name: "Trading",
    href: "/trading",
    icon: TrendingUp,
    current: false,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    current: false,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Investors",
    href: "/investors",
    icon: Users,
    current: false,
  },
];

const Sidebar = ({ className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold">Fylaro</h2>
                <p className="text-xs text-muted-foreground">Invoice Financing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                item.current && "glow"
              )}
              asChild
            >
              <a href={item.href} className="flex items-center">
                <item.icon className="h-5 w-5 mr-3" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </a>
            </Button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/settings">
              <Settings className="h-5 w-5 mr-3" />
              {!collapsed && "Settings"}
            </a>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <a href="/help">
              <HelpCircle className="h-5 w-5 mr-3" />
              {!collapsed && "Help"}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;