const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// Upload document to IPFS
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ipfsService = req.app.locals.ipfsService;
    const websocketService = req.app.locals.websocketService;

    // Prepare metadata
    const metadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
      category: req.body.category || 'general',
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    };

    // Upload to IPFS
    const uploadResult = await ipfsService.uploadDocument(req.file.buffer, metadata);

    // Store document reference in database (implement based on your DB)
    const documentRecord = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      documentHash: uploadResult.documentHash,
      metadataHash: uploadResult.metadataHash,
      encryptionInfo: uploadResult.encryptionInfo,
      metadata: uploadResult.metadata,
      uploadedAt: new Date(),
      status: 'uploaded'
    };

    // Notify user via WebSocket
    websocketService.notifyUser(req.user.id, 'document_uploaded', {
      documentId: documentRecord.id,
      documentHash: uploadResult.documentHash,
      fileName: req.file.originalname
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: documentRecord.id,
        documentHash: uploadResult.documentHash,
        metadataHash: uploadResult.metadataHash,
        fileName: req.file.originalname,
        size: req.file.size,
        uploadedAt: documentRecord.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document from IPFS
router.get('/:documentHash', auth, async (req, res) => {
  try {
    const { documentHash } = req.params;
    const { download = false } = req.query;

    const ipfsService = req.app.locals.ipfsService;

    // Check if user has access to this document (implement authorization logic)
    const hasAccess = true; // Implement proper access control

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get document metadata first
    const metadataHash = req.query.metadataHash;
    let metadata = null;
    
    if (metadataHash) {
      metadata = await ipfsService.getDocumentMetadata(metadataHash);
    }

    // Retrieve document
    const documentBuffer = await ipfsService.retrieveDocument(
      documentHash, 
      req.query.encryptionInfo ? JSON.parse(req.query.encryptionInfo) : null
    );

    // Set appropriate headers
    if (metadata) {
      res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', documentBuffer.length);
      
      if (download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
      }
    }

    res.send(documentBuffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get document metadata
router.get('/:documentHash/metadata', auth, async (req, res) => {
  try {
    const { documentHash } = req.params;
    const { metadataHash } = req.query;

    if (!metadataHash) {
      return res.status(400).json({ error: 'Metadata hash required' });
    }

    const ipfsService = req.app.locals.ipfsService;
    const metadata = await ipfsService.getDocumentMetadata(metadataHash);

    res.json(metadata);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create shareable access link
router.post('/:documentHash/share', auth, async (req, res) => {
  try {
    const { documentHash } = req.params;
    const { expirationHours = 24, maxAccess = 10 } = req.body;

    // Check if user owns this document (implement authorization logic)
    const isOwner = true; // Implement proper ownership check

    if (!isOwner) {
      return res.status(403).json({ error: 'Only document owner can create share links' });
    }

    const ipfsService = req.app.locals.ipfsService;
    const accessLink = await ipfsService.createAccessLink(documentHash, expirationHours);

    res.json({
      message: 'Access link created successfully',
      accessLink,
      expirationHours,
      maxAccess
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Access document via shared link
router.get('/access/:accessToken', async (req, res) => {
  try {
    const { accessToken } = req.params;

    // Validate access token and get document info (implement token validation)
    const accessControl = null; // Implement token lookup from database

    if (!accessControl || accessControl.expirationTime < Date.now()) {
      return res.status(404).json({ error: 'Invalid or expired access link' });
    }

    if (accessControl.accessCount >= accessControl.maxAccess) {
      return res.status(403).json({ error: 'Access limit exceeded' });
    }

    // Increment access count (implement in database)
    // accessControl.accessCount += 1;

    const ipfsService = req.app.locals.ipfsService;
    const documentBuffer = await ipfsService.retrieveDocument(accessControl.documentHash);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="shared_document"');
    res.send(documentBuffer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// List user's documents
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, category, search } = req.query;

    const ipfsService = req.app.locals.ipfsService;
    
    // Get user documents from database (implement based on your DB)
    const documents = []; // Implement database query
    
    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: documents.length,
        totalPages: Math.ceil(documents.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify document integrity
router.post('/:documentHash/verify', auth, async (req, res) => {
  try {
    const { documentHash } = req.params;
    const { originalChecksum } = req.body;

    if (!originalChecksum) {
      return res.status(400).json({ error: 'Original checksum required for verification' });
    }

    const ipfsService = req.app.locals.ipfsService;
    const isValid = await ipfsService.verifyDocumentIntegrity(documentHash, originalChecksum);

    res.json({
      documentHash,
      isValid,
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document (only marks as deleted, doesn't remove from IPFS)
router.delete('/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Check ownership and mark as deleted in database (implement based on your DB)
    const document = null; // Get document from database

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // Mark as deleted (implement in database)
    // document.status = 'deleted';
    // document.deletedAt = new Date();

    const websocketService = req.app.locals.websocketService;
    websocketService.notifyUser(userId, 'document_deleted', {
      documentId,
      fileName: document.metadata?.originalName
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
