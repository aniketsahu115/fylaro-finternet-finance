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

      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-6">
          <Card id="faq">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
                  How do the Terms of Service apply to me?
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  By creating an account or using the platform, you agree to the
                  Terms of Service. If you act on behalf of a business, you
                  represent that you are authorized to accept these terms for
                  that entity.
                </p>
              </details>

              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
                  What personal data do you collect and why?
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  We collect only the data needed to provide and improve our
                  services, comply with regulations (including KYC/AML where
                  applicable), and secure the platform. See the Privacy Policy
                  for details on categories, retention, and your rights.
                </p>
              </details>

              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
                  Are investments guaranteed or risk-free?
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  No. All investments carry risk, including loss of principal.
                  Review the Risk Disclosure and conduct independent research
                  before participating.
                </p>
              </details>

              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
                  How can I request data deletion or access?
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  You can submit a request via the Help Center or contact
                  support using the registered email on your account. We will
                  verify your identity and process the request in accordance
                  with applicable laws.
                </p>
              </details>

              <details className="group rounded-lg border border-border bg-card/50 p-4">
                <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
                  Where can I find updates to these policies?
                  <span className="ml-4 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">
                  We post updates on this page with a revised effective date.
                  For material changes, we may also notify you via email or
                  in-app notice prior to the effective date.
                </p>
              </details>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Legal;
