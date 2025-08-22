const { create } = require('ipfs-http-client');
const pinataSDK = require('@pinata/sdk');
const crypto = require('crypto');
const fs = require('fs');

class IPFSService {
  constructor() {
    // Initialize IPFS client (using Infura or local node)
    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: `Basic ${Buffer.from(
          `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
        ).toString('base64')}`
      }
    });

    // Initialize Pinata as backup/pinning service
    this.pinata = new pinataSDK(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_API_KEY
    );
  }

  /**
   * Encrypt file before storing on IPFS
   */
  encryptFile(buffer, password = process.env.ENCRYPTION_KEY) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, password);
    
    let encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: Buffer.concat([iv, authTag, encrypted]),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt file retrieved from IPFS
   */
  decryptFile(encryptedBuffer, password = process.env.ENCRYPTION_KEY) {
    const algorithm = 'aes-256-gcm';
    const iv = encryptedBuffer.slice(0, 16);
    const authTag = encryptedBuffer.slice(16, 32);
    const encrypted = encryptedBuffer.slice(32);
    
    const decipher = crypto.createDecipher(algorithm, password);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Upload encrypted document to IPFS
   */
  async uploadDocument(fileBuffer, metadata = {}) {
    try {
      // Encrypt the file
      const { encryptedData, iv, authTag } = this.encryptFile(fileBuffer);

      // Create metadata with encryption info
      const documentMetadata = {
        ...metadata,
        uploadTimestamp: Date.now(),
        encryptionIv: iv,
        encryptionAuthTag: authTag,
        originalSize: fileBuffer.length,
        encryptedSize: encryptedData.length
      };

      // Upload to IPFS
      const ipfsResult = await this.ipfs.add({
        content: encryptedData,
        path: `document_${Date.now()}`
      });

      // Upload metadata separately
      const metadataResult = await this.ipfs.add({
        content: JSON.stringify(documentMetadata, null, 2),
        path: `metadata_${Date.now()}.json`
      });

      // Pin both files using Pinata for reliability
      await this.pinata.pinByHash(ipfsResult.cid.toString());
      await this.pinata.pinByHash(metadataResult.cid.toString());

      return {
        documentHash: ipfsResult.cid.toString(),
        metadataHash: metadataResult.cid.toString(),
        encryptionInfo: {
          iv,
          authTag
        },
        metadata: documentMetadata
      };
    } catch (error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt document from IPFS
   */
  async retrieveDocument(documentHash, encryptionInfo = null) {
    try {
      // Get encrypted file from IPFS
      const chunks = [];
      for await (const chunk of this.ipfs.cat(documentHash)) {
        chunks.push(chunk);
      }
      const encryptedBuffer = Buffer.concat(chunks);

      // Decrypt if encryption info provided
      if (encryptionInfo) {
        return this.decryptFile(encryptedBuffer);
      }

      return encryptedBuffer;
    } catch (error) {
      throw new Error(`IPFS retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get document metadata from IPFS
   */
  async getDocumentMetadata(metadataHash) {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(metadataHash)) {
        chunks.push(chunk);
      }
      const metadataBuffer = Buffer.concat(chunks);
      return JSON.parse(metadataBuffer.toString());
    } catch (error) {
      throw new Error(`Metadata retrieval failed: ${error.message}`);
    }
  }

  /**
   * Verify document integrity
   */
  async verifyDocumentIntegrity(documentHash, originalChecksum) {
    try {
      const document = await this.retrieveDocument(documentHash);
      const currentChecksum = crypto
        .createHash('sha256')
        .update(document)
        .digest('hex');

      return currentChecksum === originalChecksum;
    } catch (error) {
      throw new Error(`Integrity verification failed: ${error.message}`);
    }
  }

  /**
   * Create shareable access link with expiration
   */
  async createAccessLink(documentHash, expirationHours = 24) {
    try {
      const accessToken = crypto.randomBytes(32).toString('hex');
      const expirationTime = Date.now() + (expirationHours * 60 * 60 * 1000);

      // Store access control in database (implement as needed)
      const accessControl = {
        token: accessToken,
        documentHash,
        expirationTime,
        accessCount: 0,
        maxAccess: 10
      };

      return {
        accessUrl: `${process.env.API_BASE_URL}/api/documents/access/${accessToken}`,
        accessToken,
        expirationTime
      };
    } catch (error) {
      throw new Error(`Access link creation failed: ${error.message}`);
    }
  }

  /**
   * List all documents for a user
   */
  async listUserDocuments(userId) {
    try {
      // This would typically query your database for user's document hashes
      // Then retrieve metadata for each
      const userDocuments = []; // Implement database query
      
      const documentsWithMetadata = await Promise.all(
        userDocuments.map(async (doc) => {
          const metadata = await this.getDocumentMetadata(doc.metadataHash);
          return {
            ...doc,
            metadata
          };
        })
      );

      return documentsWithMetadata;
    } catch (error) {
      throw new Error(`Document listing failed: ${error.message}`);
    }
  }
}

module.exports = IPFSService;
