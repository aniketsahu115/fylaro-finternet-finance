import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          <h1 className="text-3xl lg:text-4xl font-bold">About Us</h1>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Fylaro is building a unified, secure marketplace for tokenized
              invoices, connecting businesses with global liquidity.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default About;

