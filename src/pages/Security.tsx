import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  Server,
  Database,
  Code,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

const Security = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-16">
        <div className="absolute inset-0 professional-grid opacity-5" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <Badge className="mb-6 text-sm px-4 py-2 glow bg-primary/10 text-primary border-primary/30">
            Trust & Safety
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" /> Security
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Learn how Fylaro protects your data and assets with layered
            controls, continuous monitoring, and industry best practices.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-6xl space-y-10">
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Server,
                title: "Hardened Infrastructure",
                desc: "Segmentation, WAF, DDoS protections, and strong encryption at rest.",
              },
              {
                icon: Eye,
                title: "Continuous Monitoring",
                desc: "Real-time alerts, anomaly detection, and audit trails.",
              },
              {
                icon: Lock,
                title: "Access Control",
                desc: "RBAC, least privilege, and periodic access reviews.",
              },
            ].map((f, i) => (
              <Card
                key={i}
                className="glass-card hover:highlight-border transition-smooth backdrop-blur-md bg-card/70 border-white/10"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <f.icon className="h-6 w-6 text-primary" />
                    <div className="font-semibold">{f.title}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card
            id="infrastructure"
            className="glass-card backdrop-blur bg-card/70 border-white/10 hover:highlight-border transition-smooth"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                Infrastructure & Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-medium">Encryption</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    TLS 1.2+ in transit, AES-256 at rest
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="font-medium">Access Control</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    RBAC with least-privilege principles
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="font-medium">Network Security</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Segmentation and WAF protection
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="application"
            className="glass-card backdrop-blur bg-card/70 border-white/10 hover:highlight-border transition-smooth"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <Code className="h-5 w-5 text-green-400" />
                </div>
                Application Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-medium">Secure SDLC</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code reviews and dependency scanning
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="font-medium">OWASP Testing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automated CI checks and security tests
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="font-medium">Monitoring</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Continuous monitoring and alerting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="account"
            className="glass-card backdrop-blur bg-card/70 border-white/10 hover:highlight-border transition-smooth"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <UserCheck className="h-5 w-5 text-purple-400" />
                </div>
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-medium">Multi-Factor Auth</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    2FA support for enhanced security
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="font-medium">Session Management</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anomaly detection and monitoring
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="font-medium">Password Security</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Best practices and hygiene guidelines
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            id="responsible-disclosure"
            className="glass-card backdrop-blur bg-card/70 border-white/10 hover:highlight-border transition-smooth"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                </div>
                Responsible Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  If you believe you have found a security vulnerability, please
                  contact our team with details so we can investigate and
                  remediate promptly.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    security@fylarofinance.com
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Response within 24 hours
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Security;
