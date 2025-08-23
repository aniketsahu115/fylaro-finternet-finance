const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class IPFSService {
  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY;
    this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
    this.pinataJWT = process.env.PINATA_JWT;
    this.initialized = false;
    
    // Use local storage if Pinata not configured
    this.useLocalStorage = !this.pinataJWT;
    this.localStorage = path.join(process.cwd(), 'uploads');
    
    console.log('🔧 IPFS Service initializing...');
    if (this.useLocalStorage) {
      console.log('📁 Using local storage mode');
      this.ensureLocalStorage();
    } else {
      console.log('☁️ Using Pinata cloud storage');
    }
  }

  async ensureLocalStorage() {
    try {
      await fs.mkdir(this.localStorage, { recursive: true });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to create local storage directory:', error);
    }
  }

  async initialize() {
    if (this.initialized) return true;
    
    try {
      if (this.useLocalStorage) {
        await this.ensureLocalStorage();
      } else {
        // Test Pinata connection
        const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`
          }
        });
        
        if (response.data.message === 'Congratulations! You are communicating with the Pinata API!') {
          this.initialized = true;
        }
      }
      
      console.log('✅ IPFS Service initialized successfully');
      return true;
    } catch (error) {
      console.warn('⚠️ IPFS Service initialization failed, using local storage fallback');
      this.useLocalStorage = true;
      await this.ensureLocalStorage();
      return true;
    }
  }

  async uploadDocument(buffer, filename, metadata = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const documentId = crypto.randomUUID();
      const uploadTime = new Date().toISOString();

      if (this.useLocalStorage) {
        // Local storage implementation
        const filePath = path.join(this.localStorage, `${documentId}_${filename}`);
        await fs.writeFile(filePath, buffer);
        
        return {
          success: true,
          documentId,
          hash: crypto.createHash('sha256').update(buffer).digest('hex'),
          url: `file://${filePath}`,
          size: buffer.length,
          filename,
          uploadTime,
          metadata
        };
      } else {
        // Pinata implementation
        const formData = new FormData();
        formData.append('file', buffer, filename);
        
        const pinataMetadata = JSON.stringify({
          name: filename,
          keyvalues: {
            documentId,
            uploadTime,
            ...metadata
          }
        });
        formData.append('pinataMetadata', pinataMetadata);

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
          headers: {
            'Authorization': `Bearer ${this.pinataJWT}`,
            ...formData.getHeaders()
          }
        });

        return {
          success: true,
          documentId,
          hash: response.data.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
          size: response.data.PinSize,
          filename,
          uploadTime,
          metadata
        };
      }
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async getDocument(hash) {
    try {
      if (this.useLocalStorage) {
        // For local storage, hash is actually the file path
        const buffer = await fs.readFile(hash.replace('file://', ''));
        return buffer;
      } else {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, {
          responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
      }
    } catch (error) {
      throw new Error(`Document retrieval failed: ${error.message}`);
    }
  }

  async createAccessLink(hash, expirationHours = 24) {
    try {
      const linkId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // In a real implementation, you'd store this in a database
      // For now, return a simple access link
      return {
        linkId,
        url: this.useLocalStorage ? hash : `https://gateway.pinata.cloud/ipfs/${hash}`,
        expiresAt: expiresAt.toISOString(),
        accessCount: 0
      };
    } catch (error) {
      throw new Error(`Access link creation failed: ${error.message}`);
    }
  }

  async verifyDocumentIntegrity(hash, originalChecksum) {
    try {
      const document = await this.getDocument(hash);
      const currentChecksum = crypto.createHash('sha256').update(document).digest('hex');
      
      return {
        isValid: currentChecksum === originalChecksum,
        originalChecksum,
        currentChecksum
      };
    } catch (error) {
      throw new Error(`Document verification failed: ${error.message}`);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async close() {
    // Cleanup if needed
    this.initialized = false;
    console.log('📦 IPFS Service closed');
  }
}

module.exports = IPFSService;
