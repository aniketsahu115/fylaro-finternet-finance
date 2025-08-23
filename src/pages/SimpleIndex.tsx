import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import TestComponent from "@/components/TestComponent";

export default function SimpleIndex() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Fylaro Finance - Test Page
        </h1>
        
        <TestComponent />
        
        <div className="text-center mt-8">
          <p className="text-lg text-gray-600 mb-4">
            If you can see this, React is working correctly!
          </p>
          <Button onClick={() => navigate('/dashboard')} className="mx-2">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="outline" className="mx-2">
            Go to Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}
