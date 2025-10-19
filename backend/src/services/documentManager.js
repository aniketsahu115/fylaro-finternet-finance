// Document management service with IPFS integration
const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

class DocumentManagerService {
  constructor() {
    this.ipfsGateway =
      process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY;
    this.pinataJWT = process.env.PINATA_JWT;

    this.supportedTypes = {
      images: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
      documents: ["pdf", "doc", "docx", "txt", "rtf"],
      spreadsheets: ["xls", "xlsx", "csv"],
      presentations: ["ppt", "pptx"],
      archives: ["zip", "rar", "7z", "tar", "gz"],
    };

    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.documentStorage = new Map();
    this.verificationQueue = [];
    this.ocrResults = new Map();

    this.initializeStorage();
  }

  // Initialize document storage
  initializeStorage() {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  // Upload document to IPFS
  async uploadDocument(file, metadata = {}) {
    try {
      // Validate file
      this.validateFile(file);

      // Generate document ID
      const documentId = this.generateDocumentId();

      // Upload to IPFS
      const ipfsHash = await this.uploadToIPFS(file, metadata);

      // Store document metadata
      const document = {
        id: documentId,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        ipfsHash,
        ipfsUrl: `${this.ipfsGateway}${ipfsHash}`,
        metadata: {
          ...metadata,
          uploadedAt: new Date(),
          checksum: this.calculateChecksum(file.path),
        },
        status: "uploaded",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.documentStorage.set(documentId, document);

      // Queue for verification if it's an invoice
      if (metadata.type === "invoice") {
        this.queueForVerification(documentId);
      }

      return {
        success: true,
        documentId,
        ipfsHash,
        ipfsUrl: document.ipfsUrl,
        metadata: document.metadata,
      };
    } catch (error) {
      console.error("Document upload error:", error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  // Upload to IPFS via Pinata
  async uploadToIPFS(file, metadata) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(file.path));
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: file.originalname,
          keyvalues: metadata,
        })
      );
      formData.append(
        "pinataOptions",
        JSON.stringify({
          cidVersion: 1,
        })
      );

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: this.pinataApiKey,
            pinata_secret_api_key: this.pinataSecretKey,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error("IPFS upload error:", error);
      throw new Error("Failed to upload to IPFS");
    }
  }

  // Get document by ID
  getDocument(documentId) {
    const document = this.documentStorage.get(documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    return document;
  }

  // Get document content
  async getDocumentContent(documentId) {
    const document = this.getDocument(documentId);

    if (document.status !== "uploaded") {
      throw new Error("Document not available");
    }

    try {
      // Try to get from IPFS first
      const response = await axios.get(document.ipfsUrl, {
        responseType: "stream",
        timeout: 30000,
      });

      return {
        stream: response.data,
        contentType: document.mimeType,
        contentLength: document.fileSize,
      };
    } catch (error) {
      // Fallback to local file
      if (fs.existsSync(document.filePath)) {
        return {
          stream: fs.createReadStream(document.filePath),
          contentType: document.mimeType,
          contentLength: document.fileSize,
        };
      }

      throw new Error("Document content not available");
    }
  }

  // Create shareable link
  async createShareableLink(documentId, options = {}) {
    const document = this.getDocument(documentId);

    const shareId = this.generateShareId();
    const expiresAt =
      options.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const shareLink = {
      id: shareId,
      documentId,
      url: `${process.env.FRONTEND_URL}/shared/${shareId}`,
      expiresAt,
      password: options.password ? this.hashPassword(options.password) : null,
      accessCount: 0,
      maxAccess: options.maxAccess || null,
      createdAt: new Date(),
    };

    // Store share link (in production, use database)
    this.documentStorage.set(`share_${shareId}`, shareLink);

    return {
      success: true,
      shareId,
      url: shareLink.url,
      expiresAt,
    };
  }

  // Verify shareable link
  verifyShareableLink(shareId, password = null) {
    const shareLink = this.documentStorage.get(`share_${shareId}`);

    if (!shareLink) {
      throw new Error("Share link not found");
    }

    if (new Date() > shareLink.expiresAt) {
      throw new Error("Share link expired");
    }

    if (shareLink.maxAccess && shareLink.accessCount >= shareLink.maxAccess) {
      throw new Error("Share link access limit exceeded");
    }

    if (
      shareLink.password &&
      !this.verifyPassword(password, shareLink.password)
    ) {
      throw new Error("Invalid password");
    }

    // Increment access count
    shareLink.accessCount++;
    this.documentStorage.set(`share_${shareId}`, shareLink);

    return this.getDocument(shareLink.documentId);
  }

  // Process document with OCR
  async processDocumentWithOCR(documentId) {
    const document = this.getDocument(documentId);

    if (!this.isImageDocument(document)) {
      throw new Error("OCR only supported for image documents");
    }

    try {
      // Mock OCR processing - in production, integrate with actual OCR service
      const ocrResult = await this.performOCR(document);

      this.ocrResults.set(documentId, {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processedAt: new Date(),
      });

      return {
        success: true,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
      };
    } catch (error) {
      console.error("OCR processing error:", error);
      throw new Error("Failed to process document with OCR");
    }
  }

  // Verify invoice document
  async verifyInvoiceDocument(documentId) {
    const document = this.getDocument(documentId);

    if (document.metadata.type !== "invoice") {
      throw new Error("Document is not an invoice");
    }

    try {
      // Perform invoice verification checks
      const verificationResult = await this.performInvoiceVerification(
        document
      );

      // Update document status
      document.status = verificationResult.isValid ? "verified" : "rejected";
      document.verificationResult = verificationResult;
      document.updatedAt = new Date();

      this.documentStorage.set(documentId, document);

      return {
        success: true,
        isValid: verificationResult.isValid,
        confidence: verificationResult.confidence,
        issues: verificationResult.issues,
        extractedData: verificationResult.extractedData,
      };
    } catch (error) {
      console.error("Invoice verification error:", error);
      throw new Error("Failed to verify invoice document");
    }
  }

  // Get document analytics
  getDocumentAnalytics(filters = {}) {
    const documents = Array.from(this.documentStorage.values()).filter(
      (doc) => !doc.id.startsWith("share_")
    );

    let filteredDocs = documents;

    if (filters.type) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.metadata.type === filters.type
      );
    }

    if (filters.status) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.status === filters.status
      );
    }

    if (filters.startDate) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.createdAt >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filteredDocs = filteredDocs.filter(
        (doc) => doc.createdAt <= new Date(filters.endDate)
      );
    }

    const totalDocuments = filteredDocs.length;
    const totalSize = filteredDocs.reduce((sum, doc) => sum + doc.fileSize, 0);
    const typeDistribution = this.getTypeDistribution(filteredDocs);
    const statusDistribution = this.getStatusDistribution(filteredDocs);
    const sizeDistribution = this.getSizeDistribution(filteredDocs);

    return {
      totalDocuments,
      totalSize,
      averageSize: totalDocuments > 0 ? totalSize / totalDocuments : 0,
      typeDistribution,
      statusDistribution,
      sizeDistribution,
    };
  }

  // Delete document
  async deleteDocument(documentId) {
    const document = this.getDocument(documentId);

    try {
      // Remove from IPFS (if possible)
      await this.removeFromIPFS(document.ipfsHash);

      // Remove local file
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Remove from storage
      this.documentStorage.delete(documentId);

      return { success: true };
    } catch (error) {
      console.error("Document deletion error:", error);
      throw new Error("Failed to delete document");
    }
  }

  // Utility methods
  validateFile(file) {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > this.maxFileSize) {
      throw new Error("File too large");
    }

    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    const allSupportedTypes = Object.values(this.supportedTypes).flat();

    if (!allSupportedTypes.includes(extension)) {
      throw new Error("Unsupported file type");
    }
  }

  generateDocumentId() {
    return `doc_${crypto.randomBytes(16).toString("hex")}`;
  }

  generateShareId() {
    return `share_${crypto.randomBytes(16).toString("hex")}`;
  }

  calculateChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  isImageDocument(document) {
    return this.supportedTypes.images.some((ext) =>
      document.originalName.toLowerCase().endsWith(`.${ext}`)
    );
  }

  async performOCR(document) {
    // Mock OCR result - in production, integrate with actual OCR service
    return {
      text: "Sample extracted text from document",
      confidence: 0.95,
    };
  }

  async performInvoiceVerification(document) {
    // Mock invoice verification - in production, use AI/ML models
    return {
      isValid: true,
      confidence: 0.92,
      issues: [],
      extractedData: {
        invoiceNumber: "INV-2024-001",
        amount: 125000,
        dueDate: "2024-03-15",
        vendor: "Sample Vendor",
        customer: "Sample Customer",
      },
    };
  }

  async removeFromIPFS(ipfsHash) {
    // Mock IPFS removal - in production, use Pinata API
    console.log(`Removing ${ipfsHash} from IPFS`);
  }

  queueForVerification(documentId) {
    this.verificationQueue.push({
      documentId,
      queuedAt: new Date(),
      priority: "normal",
    });
  }

  getTypeDistribution(documents) {
    const distribution = {};
    documents.forEach((doc) => {
      const type = doc.metadata.type || "unknown";
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return distribution;
  }

  getStatusDistribution(documents) {
    const distribution = {};
    documents.forEach((doc) => {
      distribution[doc.status] = (distribution[doc.status] || 0) + 1;
    });
    return distribution;
  }

  getSizeDistribution(documents) {
    const ranges = [
      { label: "0-1MB", min: 0, max: 1024 * 1024 },
      { label: "1-10MB", min: 1024 * 1024, max: 10 * 1024 * 1024 },
      { label: "10-50MB", min: 10 * 1024 * 1024, max: 50 * 1024 * 1024 },
      { label: "50MB+", min: 50 * 1024 * 1024, max: Infinity },
    ];

    const distribution = {};
    ranges.forEach((range) => {
      distribution[range.label] = documents.filter(
        (doc) => doc.fileSize >= range.min && doc.fileSize < range.max
      ).length;
    });

    return distribution;
  }

  // Get service statistics
  getStats() {
    const documents = Array.from(this.documentStorage.values()).filter(
      (doc) => !doc.id.startsWith("share_")
    );

    const totalDocuments = documents.length;
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const verifiedDocuments = documents.filter(
      (doc) => doc.status === "verified"
    ).length;
    const pendingVerification = this.verificationQueue.length;

    return {
      totalDocuments,
      totalSize,
      verifiedDocuments,
      pendingVerification,
      supportedTypes: this.supportedTypes,
      maxFileSize: this.maxFileSize,
    };
  }
}

module.exports = DocumentManagerService;
