import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Security = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          <h1 className="text-3xl lg:text-4xl font-bold">Security</h1>
          <p className="text-muted-foreground">
            Learn how Fylaro protects your data and assets.
          </p>

          <Card id="infrastructure">
            <CardHeader>
              <CardTitle>Infrastructure & Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption in transit (TLS 1.2+) and at rest.</li>
                <li>
                  Role-based access control and least-privilege principles.
                </li>
                <li>Network segmentation and WAF protection.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="application">
            <CardHeader>
              <CardTitle>Application Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Secure SDLC with code reviews and dependency scanning.</li>
                <li>OWASP-aligned testing and automated CI checks.</li>
                <li>Continuous monitoring and alerting.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="account">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Multi-factor authentication support.</li>
                <li>Session management and anomaly detection.</li>
                <li>Best practices for password hygiene.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="responsible-disclosure">
            <CardHeader>
              <CardTitle>Responsible Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                If you believe you have found a security vulnerability, please
                contact our team at security@fylaro.com with details so we can
                investigate and remediate promptly.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Security;
