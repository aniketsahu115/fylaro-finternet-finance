import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="py-16">
        <div className="container mx-auto px-6 max-w-4xl space-y-8">
          <h1 className="text-3xl lg:text-4xl font-bold">Careers</h1>
          <Card className="bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle>Join the Team</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We are hiring passionate builders in engineering, product, and
              design. Stay tuned for openings.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Careers;
