import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { WalletDebugger } from "@/components/features/WalletDebugger";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <div className="hidden lg:block w-64 h-[calc(100vh-4rem)]">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <WalletDebugger />
      <Toaster />
    </div>
  );
};

export default DashboardLayout;