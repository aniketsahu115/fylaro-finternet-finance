import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Book,
  MessageSquare,
  Video,
  Mail,
  Phone,
  FileText,
  Search,
  ExternalLink,
  Users,
  Shield,
  Zap,
} from "lucide-react";

const HelpPage = () => {
  const faqData = [
    {
      question: "How do I upload and tokenize an invoice?",
      answer:
        "Navigate to the Upload page, select your invoice file (PDF, PNG, JPG), fill in the required details like invoice amount and due date, then click 'Tokenize Invoice'. The system will process your invoice and create tradeable tokens.",
    },
    {
      question: "What happens after I tokenize my invoice?",
      answer:
        "Once tokenized, your invoice becomes available on the marketplace for investors to purchase. You'll receive immediate liquidity (typically 70-90% of invoice value) while investors earn returns when the invoice is paid by your customer.",
    },
    {
      question: "How do I connect my crypto wallet?",
      answer:
        "Click the 'Connect Wallet' button in the top navigation. We support MetaMask, WalletConnect, and other popular wallets. Make sure you're on the BSC (Binance Smart Chain) network for optimal functionality.",
    },
    {
      question: "What are the fees for using Fylaro?",
      answer:
        "We charge a small platform fee (typically 2-3%) on successful transactions. There are no upfront costs for uploading or tokenizing invoices. Gas fees for blockchain transactions apply as per network rates.",
    },
    {
      question: "How long does it take to receive funds?",
      answer:
        "Once your invoice is purchased by investors, funds are typically transferred within 24-48 hours. The exact timing depends on blockchain confirmation times and your payment method.",
    },
    {
      question: "Is my financial data secure?",
      answer:
        "Yes, we use enterprise-grade encryption and security measures. All sensitive data is encrypted, and we follow strict compliance standards. Smart contracts handle transactions transparently on the blockchain.",
    },
    {
      question: "Can I track my invoice status?",
      answer:
        "Absolutely! Use the Dashboard and Portfolio pages to track all your invoices in real-time. You can see tokenization status, investor activity, payment progress, and more.",
    },
    {
      question: "What if my customer doesn't pay the invoice?",
      answer:
        "We have risk assessment mechanisms in place. However, if an invoice defaults, the loss is typically shared between the platform and investors according to our terms. We recommend only tokenizing invoices from reliable customers.",
    },
  ];

  const quickActions = [
    {
      title: "Getting Started Guide",
      description: "Complete walkthrough for new users",
      icon: Book,
      action: "View Guide",
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video instructions",
      icon: Video,
      action: "Watch Videos",
    },
    {
      title: "API Documentation",
      description: "Technical integration guide",
      icon: FileText,
      action: "View Docs",
    },
    {
      title: "Community Forum",
      description: "Connect with other users",
      icon: Users,
      action: "Join Forum",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <HelpCircle className="h-8 w-8 mr-3" />
              Help & Support
            </h1>
            <p className="text-muted-foreground">
              Get help with Fylaro Finance and invoice tokenization
            </p>
          </div>
        </div>

        {/* Search Help */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search for help articles, tutorials, or FAQ..."
                className="flex-1"
              />
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6 text-center">
                  <action.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {action.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    {action.action}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get instant help from our support team
              </p>
              <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/30">
                Online Now
              </Badge>
              <Button className="w-full">Start Chat</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Send us a detailed message
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Response time: 2-4 hours
              </p>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Speak directly with our team
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Mon-Fri: 9 AM - 6 PM EST
              </p>
              <Button variant="outline" className="w-full">
                Call Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Instant Liquidity</h3>
                <p className="text-sm text-muted-foreground">
                  Convert invoices to cash in minutes, not months
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Secure & Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Blockchain-powered security with full transparency
                </p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Global Marketplace</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with investors worldwide for the best rates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Page */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Platform Services</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Blockchain Network</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  Operational
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Processing</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HelpPage;
