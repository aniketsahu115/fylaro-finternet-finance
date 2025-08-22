import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DocumentUpload from "@/components/features/DocumentUpload";
import { useState } from "react";
import {
  Upload,
  FileText,
  DollarSign,
  Calendar,
  Building,
  Shield,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const UploadInvoice = () => {
  const [uploadStep, setUploadStep] = useState(1);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    amount: "",
    dueDate: "",
    debtorName: "",
    debtorEmail: "",
    description: "",
    industry: "",
    file: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verificationResults, setVerificationResults] = useState(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadStep(2), 500);
        }
      }, 200);
    }
  };

  const handleSubmit = async () => {
    // Simulate verification process
    setUploadStep(3);
    
    setTimeout(() => {
      setVerificationResults({
        creditScore: 847,
        fraudScore: 0.12,
        riskLevel: "Low",
        estimatedFunding: 95000,
        expectedTimeline: "24-48 hours"
      });
      setUploadStep(4);
    }, 3000);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Upload Your Invoice</h2>
        <p className="text-muted-foreground">
          Upload your invoice document to start the tokenization process
        </p>
      </div>

      <DocumentUpload 
        onUploadComplete={(file) => {
          setFormData(prev => ({ ...prev, file }));
          setUploadStep(2);
        }}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Invoice Details</h2>
        <p className="text-muted-foreground">
          Please fill in the invoice information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                placeholder="INV-2024-001"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange("invoiceNumber", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Invoice Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="100000"
                  className="pl-10"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="due-date"
                  type="date"
                  className="pl-10"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Debtor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debtor-name">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="debtor-name"
                  placeholder="Company Inc."
                  className="pl-10"
                  value={formData.debtorName}
                  onChange={(e) => handleInputChange("debtorName", e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="debtor-email">Contact Email</Label>
              <Input
                id="debtor-email"
                type="email"
                placeholder="contact@company.com"
                value={formData.debtorEmail}
                onChange={(e) => handleInputChange("debtorEmail", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Invoice Description</Label>
              <Textarea
                id="description"
                placeholder="Professional services rendered for Q4 2024..."
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="glow">
          Submit for Verification
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-warning animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verification in Progress</h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your invoice for authenticity and risk assessment
        </p>
      </div>

      <Card className="gradient-card border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <span>Document Analysis</span>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <span>Fraud Detection</span>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <span>Credit Score Analysis</span>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
              <span>Risk Assessment</span>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verification Complete!</h2>
        <p className="text-muted-foreground">
          Your invoice has been successfully verified and is ready for tokenization
        </p>
      </div>

      {verificationResults && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-primary" />
                Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Credit Score</span>
                <Badge className="bg-success">{verificationResults.creditScore}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Fraud Risk</span>
                <Badge variant="secondary">{(verificationResults.fraudScore * 100).toFixed(1)}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Risk Level</span>
                <Badge className="bg-success">{verificationResults.riskLevel}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Funding Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">
                  ${verificationResults.estimatedFunding.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Estimated Funding</p>
              </div>
              <div className="flex justify-between items-center">
                <span>Expected Timeline</span>
                <span className="font-medium">{verificationResults.expectedTimeline}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Funding Rate</span>
                <span className="font-medium text-success">
                  {((verificationResults.estimatedFunding / parseFloat(formData.amount)) * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your invoice will be tokenized as an NFT on the blockchain</li>
                <li>• It will be listed on the marketplace for investor bidding</li>
                <li>• You'll receive notifications when investors place bids</li>
                <li>• Once funded, payment tracking will begin automatically</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button variant="outline">
          Upload Another Invoice
        </Button>
        <Button className="glow">
          View in Marketplace
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${step <= uploadStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {step < uploadStep ? <CheckCircle className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 w-20 mx-2 
                      ${step < uploadStep ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Upload</span>
            <span>Details</span>
            <span>Verify</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step Content */}
        {uploadStep === 1 && renderStep1()}
        {uploadStep === 2 && renderStep2()}
        {uploadStep === 3 && renderStep3()}
        {uploadStep === 4 && renderStep4()}
      </div>
    </DashboardLayout>
  );
};

export default UploadInvoice;