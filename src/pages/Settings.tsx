import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Bell,
  Shield,
  Wallet,
  Globe,
  Eye,
  Save,
} from "lucide-react";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center">
              <Settings className="h-8 w-8 mr-3" />
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-muted/40 backdrop-blur-sm">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/60 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Enter your company name" />
                </div>
                <div className="flex justify-end">
                  <Button className="min-w-40">
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card/60 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Invoice Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when invoices are processed
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts for payment activities
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Trading Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Market updates and trading opportunities
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card/60 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <div className="flex justify-end">
                    <Button className="min-w-40">Update Password</Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-md border border-border">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add extra security to your account
                      </p>
                    </div>
                    <Badge variant="outline">Not Enabled</Badge>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" className="min-w-40">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-card/60 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Auto-save Drafts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save invoice drafts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5">
                    <Label>Advanced Charts</Label>
                    <p className="text-sm text-muted-foreground">
                      Show advanced analytics charts
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input defaultValue="USD" placeholder="USD" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Input defaultValue="UTC" placeholder="UTC" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
