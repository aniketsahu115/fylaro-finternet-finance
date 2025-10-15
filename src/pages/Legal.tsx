import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          <h1 className="text-3xl lg:text-4xl font-bold">Legal</h1>
          <p className="text-muted-foreground">
            Learn about our terms, privacy practices, and risk disclosures.
          </p>

          <Card id="terms">
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                These Terms govern your use of the Fylaro platform. By accessing
                or using the services, you agree to be bound by these Terms.
              </p>
            </CardContent>
          </Card>

          <Card id="privacy">
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                We respect your privacy. This policy explains what information
                we collect, why we collect it, and how we use and protect it.
              </p>
            </CardContent>
          </Card>

          <Card id="risk">
            <CardHeader>
              <CardTitle>Risk Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Investing involves risk, including possible loss of principal.
                Do your own research and consider your financial situation
                before participating.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Legal;
