import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Code,
  Shield,
  TrendingUp,
  Handshake,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";

const Careers = () => {
  const jobOpenings = [
    {
      id: "marketing-strategist",
      title: "Marketing Strategist",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      icon: TrendingUp,
      color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
      description:
        "Drive growth and brand awareness for our fintech platform through strategic marketing initiatives.",
      requirements: [
        "3+ years experience in fintech or financial services marketing",
        "Proven track record in B2B marketing and lead generation",
        "Experience with digital marketing channels (SEO, SEM, social media)",
        "Knowledge of financial regulations and compliance marketing",
        "Strong analytical skills and data-driven approach",
        "Experience with marketing automation tools (HubSpot, Marketo)",
      ],
      responsibilities: [
        "Develop and execute comprehensive marketing strategies",
        "Create content for financial services and blockchain technology",
        "Manage digital marketing campaigns and lead generation",
        "Analyze market trends and competitive landscape",
        "Collaborate with product and sales teams",
      ],
    },
    {
      id: "smart-contract-auditor",
      title: "Smart Contract Auditor",
      department: "Security",
      location: "Remote",
      type: "Full-time",
      icon: Shield,
      color: "bg-green-500/20 border-green-500/30 text-green-400",
      description:
        "Ensure the security and reliability of our smart contracts through comprehensive auditing and testing.",
      requirements: [
        "2+ years experience in smart contract auditing",
        "Deep understanding of Solidity and EVM",
        "Experience with DeFi protocols and financial smart contracts",
        "Knowledge of common vulnerabilities (OWASP Top 10)",
        "Experience with auditing tools (Slither, Mythril, Echidna)",
        "Strong understanding of blockchain security best practices",
      ],
      responsibilities: [
        "Audit smart contracts for security vulnerabilities",
        "Review code for compliance with best practices",
        "Create detailed audit reports and recommendations",
        "Work with development team on security improvements",
        "Stay updated with latest security threats and solutions",
      ],
    },
    {
      id: "backend-engineer",
      title: "Backend Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      icon: Code,
      color: "bg-purple-500/20 border-purple-500/30 text-purple-400",
      description:
        "Build and maintain the core infrastructure powering our invoice financing platform.",
      requirements: [
        "3+ years experience in backend development",
        "Proficiency in Node.js, Python, or Go",
        "Experience with blockchain integration (Web3, ethers.js)",
        "Knowledge of microservices architecture",
        "Experience with cloud platforms (AWS, GCP, Azure)",
        "Understanding of financial systems and payment processing",
      ],
      responsibilities: [
        "Develop and maintain backend services",
        "Integrate with blockchain networks and smart contracts",
        "Build APIs for frontend and third-party integrations",
        "Implement security measures and data protection",
        "Optimize system performance and scalability",
      ],
    },
    {
      id: "lead-operations",
      title: "Lead Operations",
      department: "Operations",
      location: "Remote",
      type: "Full-time",
      icon: Users,
      color: "bg-orange-500/20 border-orange-500/30 text-orange-400",
      description:
        "Oversee day-to-day operations and ensure smooth platform functionality and user experience.",
      requirements: [
        "5+ years experience in operations management",
        "Experience in fintech or financial services",
        "Strong project management skills",
        "Knowledge of compliance and regulatory requirements",
        "Experience with customer support and user onboarding",
        "Analytical mindset with problem-solving abilities",
      ],
      responsibilities: [
        "Manage daily platform operations and monitoring",
        "Coordinate between technical and business teams",
        "Ensure compliance with financial regulations",
        "Optimize operational processes and workflows",
        "Handle customer support and issue resolution",
      ],
    },
    {
      id: "bd-associate",
      title: "Business Development Associate",
      department: "Business Development",
      location: "Remote",
      type: "Full-time",
      icon: Handshake,
      color: "bg-red-500/20 border-red-500/30 text-red-400",
      description:
        "Drive business growth through strategic partnerships and client acquisition in the financial services sector.",
      requirements: [
        "2+ years experience in B2B sales or business development",
        "Experience in fintech or financial services",
        "Strong networking and relationship-building skills",
        "Understanding of invoice financing and trade finance",
        "Experience with CRM systems and sales processes",
        "Excellent communication and presentation skills",
      ],
      responsibilities: [
        "Identify and pursue new business opportunities",
        "Build relationships with potential clients and partners",
        "Develop proposals and negotiate contracts",
        "Collaborate with marketing team on lead generation",
        "Track and report on business development metrics",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-16">
        <div className="absolute inset-0 professional-grid opacity-5" />
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <Badge className="mb-6 text-sm px-4 py-2 glow bg-primary/10 text-primary border-primary/30">
            We're Hiring
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Careers
          </h1>
          <p className="text-muted-foreground max-w-3xl text-lg">
            Join our mission to revolutionize invoice financing through
            blockchain technology. We're building the future of financial
            infrastructure with passionate, talented individuals.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6 max-w-6xl space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Open Positions
            </h2>
            <p className="text-muted-foreground">
              Explore opportunities to shape the future of finance
            </p>
          </div>

          <div className="grid gap-6">
            {jobOpenings.map((job) => (
              <Card
                key={job.id}
                className="glass-card backdrop-blur bg-card/70 border-white/10 hover:highlight-border transition-smooth"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${job.color}`}>
                        <job.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {job.department}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {job.type}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{job.description}</p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {job.requirements.map((req, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Responsibilities</h4>
                      <ul className="space-y-2">
                        {job.responsibilities.map((resp, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Application Process */}
          <Card className="glass-card backdrop-blur bg-card/70 border-white/10 mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                How to Apply
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Send Your Application</h4>
                  <p className="text-sm text-muted-foreground">
                    Email your resume and cover letter to careers@fylaro.com
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">Initial Review</h4>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your application within 5 business days
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">Interview Process</h4>
                  <p className="text-sm text-muted-foreground">
                    Technical and cultural fit interviews with our team
                  </p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Questions?</strong> Reach out to us at
                  careers@fylaro.com or connect with us on LinkedIn.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Careers;
