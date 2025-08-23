import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Download,
  Scan,
  Shield
} from "lucide-react";

interface DocumentUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'verified' | 'error';
  progress: number;
  extractedData?: any;
  securityScan?: {
    passed: boolean;
    issues: string[];
  };
}

const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
  const [uploadError, setUploadError] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input clicked'); // Debug log
    const selectedFiles = Array.from(e.target.files || []);
    console.log('Selected files:', selectedFiles); // Debug log
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const processFiles = (fileList: File[]) => {
    console.log('Processing files:', fileList); // Debug log
    setUploadError(''); // Clear any previous errors
    
    // Validate file types and sizes
    const validFiles = fileList.filter(file => {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        console.warn(`Invalid file type: ${file.type}`);
        setUploadError(`Invalid file type: ${file.name}. Please upload PDF, PNG, JPG, or JPEG files only.`);
        return false;
      }
      
      if (file.size > maxSize) {
        console.warn(`File too large: ${file.size}`);
        setUploadError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      console.warn('No valid files to process');
      if (!uploadError) {
        setUploadError('No valid files selected. Please choose PDF, PNG, JPG, or JPEG files under 10MB.');
      }
      return;
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    console.log('Adding new files:', newFiles); // Debug log
    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach(file => {
      simulateUploadProcess(file.id);
    });
  };

  const simulateUploadProcess = async (fileId: string) => {
    // Upload simulation
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      updateFileProgress(fileId, progress, 'uploading');
    }

    // Processing simulation
    updateFileStatus(fileId, 'processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Security scan simulation
    const securityScan = {
      passed: Math.random() > 0.1, // 90% pass rate
      issues: Math.random() > 0.8 ? ['Suspicious metadata detected'] : []
    };

    // Document extraction simulation
    const extractedData = {
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
      amount: (Math.random() * 100000 + 10000).toFixed(2),
      dueDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendor: "Sample Company Inc.",
      confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
    };

    updateFileComplete(fileId, securityScan.passed ? 'verified' : 'error', extractedData, securityScan);
  };

  const updateFileProgress = (fileId: string, progress: number, status: UploadedFile['status']) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, progress, status } : file
    ));
  };

  const updateFileStatus = (fileId: string, status: UploadedFile['status']) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status } : file
    ));
  };

  const updateFileComplete = (
    fileId: string, 
    status: UploadedFile['status'], 
    extractedData: any, 
    securityScan: any
  ) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status, extractedData, securityScan } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Scan className="h-4 w-4 animate-spin text-primary" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-success/10 text-success border-success/30';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'processing':
      case 'uploading':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Document Upload
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={uploadMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('single')}
              >
                Single
              </Button>
              <Button
                variant={uploadMode === 'batch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('batch')}
              >
                Batch
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors text-center ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Drag and drop your documents here
                </h3>
                <p className="text-muted-foreground mb-4">
                  Supported formats: PDF, PNG, JPG, JPEG (Max 10MB each)
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Label htmlFor="file-upload">
                    <Button 
                      className="glow cursor-pointer"
                      onClick={() => {
                        console.log('Choose Files button clicked'); // Debug log
                        document.getElementById('file-upload')?.click();
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple={uploadMode === 'batch'}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      console.log('Scan Document button clicked'); // Debug log
                      // Placeholder for document scanning functionality
                    }}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Document
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Upload Error</span>
              </div>
              <p className="text-xs text-destructive mt-1">{uploadError}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Security Features</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All documents are encrypted during upload and undergo automatic security scanning
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Uploaded Documents ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border border-border rounded-lg p-4 bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(file.status)}>
                        {file.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(file.status === 'uploading' || file.status === 'processing') && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          {file.status === 'uploading' ? 'Uploading' : 'Processing'}...
                        </span>
                        <span>{file.progress || 0}%</span>
                      </div>
                      <Progress value={file.progress || 0} />
                    </div>
                  )}

                  {file.extractedData && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3 p-3 bg-muted/20 rounded">
                      <div>
                        <p className="text-xs text-muted-foreground">Invoice #</p>
                        <p className="text-sm font-medium">{file.extractedData.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm font-medium">${file.extractedData.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm font-medium">{file.extractedData.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-sm font-medium">
                          {(file.extractedData.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {file.securityScan && !file.securityScan.passed && (
                    <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
                      <p className="text-sm font-medium text-destructive mb-1">Security Issues Detected</p>
                      <ul className="text-xs text-destructive">
                        {file.securityScan.issues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {file.status === 'verified' && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Preview clicked for file:', file.name);
                          // Placeholder for preview functionality
                          alert(`Preview functionality for ${file.name} - Feature coming soon!`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Download clicked for file:', file.name);
                          // Placeholder for download functionality
                          alert(`Download functionality for ${file.name} - Feature coming soon!`);
                        }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {files.some(f => f.status === 'verified') && (
              <div className="flex justify-end pt-4 border-t border-border">
                <Button 
                  className="glow"
                  onClick={() => {
                    const verifiedFiles = files.filter(f => f.status === 'verified');
                    console.log('Continuing with verification for files:', verifiedFiles);
                    onUploadComplete?.(verifiedFiles);
                  }}
                >
                  Continue with Verification ({files.filter(f => f.status === 'verified').length} files)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;