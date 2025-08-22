import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bell, Globe, Sun, Moon, Menu } from "lucide-react";

export const IconTestComponent = () => {
  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Icon Visibility Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Hover over these buttons to test icon visibility:</p>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="navbar-button">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="navbar-button">
              <Bell className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="navbar-button">
              <Globe className="h-4 w-4 mr-2" />
              EN
            </Button>
            
            <Button variant="ghost" size="sm" className="navbar-button">
              <Sun className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="navbar-button">
              <Moon className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="sm" className="navbar-button">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            ✅ Icons should remain visible when hovering<br/>
            ✅ Icons should change color smoothly<br/>
            ❌ Icons should NOT disappear
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
