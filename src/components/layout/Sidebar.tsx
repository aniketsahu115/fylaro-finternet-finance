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
  Users,
  Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: ShoppingCart,
  },
  {
    name: "Upload Invoice",
    href: "/upload",
    icon: Upload,
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
  },
  {
    name: "Trading",
    href: "/trading",
    icon: TrendingUp,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    badge: "3",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
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
            <div className="h-8 w-8 rounded-lg overflow-hidden">
              <img src="/src/assets/fylaro-logo.png" alt="Fylaro Logo" className="w-full h-full object-cover" />
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
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "w-full justify-start flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground glow" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )
              }
            >
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
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <NavLink 
            to="/settings"
            className={({ isActive }) =>
              cn(
                "w-full justify-start flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )
            }
          >
            <Settings className="h-5 w-5 mr-3" />
            {!collapsed && "Settings"}
          </NavLink>
          <NavLink 
            to="/help"
            className={({ isActive }) =>
              cn(
                "w-full justify-start flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )
            }
          >
            <HelpCircle className="h-5 w-5 mr-3" />
            {!collapsed && "Help"}
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;