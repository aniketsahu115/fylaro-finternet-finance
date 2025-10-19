// Web3 service for blockchain integration
import { ethers } from "ethers";

// Contract ABIs (simplified for demo)
const INVOICE_TOKEN_ABI = [
  "function tokenizeInvoice(string memory _invoiceId, uint256 _totalValue, uint256 _totalShares, uint256 _dueDate, address _debtor, string memory _ipfsHash, string memory _industry, uint8 _riskRating, uint256 _interestRate) external payable returns (uint256)",
  "function getInvoice(uint256 tokenId) external view returns (tuple(uint256 totalValue, uint256 totalShares, uint256 dueDate, address issuer, address debtor, string invoiceId, string ipfsHash, bool isVerified, bool isPaid, uint256 creditScore, string industry, uint256 createdAt, uint256 maturityDate, uint8 riskRating, uint256 interestRate))",
  "function verifyInvoice(uint256 tokenId) external",
  "function markInvoicePaid(uint256 tokenId, uint256 paidAmount) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external",
  "function addVerifiedIssuer(address issuer) external",
  "event InvoiceTokenized(uint256 indexed tokenId, string invoiceId, address indexed issuer, uint256 totalValue, uint256 totalShares, uint256 dueDate)",
  "event InvoiceVerified(uint256 indexed tokenId, address verifier)",
  "event InvoicePaid(uint256 indexed tokenId, uint256 amount, uint256 timestamp)",
];

const MARKETPLACE_ABI = [
  "function listToken(uint256 _tokenId, uint256 _price, uint256 _duration) external",
  "function buyToken(uint256 _tokenId) external payable",
  "function placeBid(uint256 _tokenId) external payable",
  "function acceptBid(uint256 _tokenId) external",
  "function cancelListing(uint256 _tokenId) external",
  "function getListing(uint256 _tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool isActive, uint256 createdAt, uint256 expiresAt))",
  "function getBidCount(uint256 _tokenId) external view returns (uint256)",
  "event TokenListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 expiresAt)",
  "event TokenSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount)",
];

const UNIFIED_LEDGER_ABI = [
  "function initiateNativeTransfer(uint8 destinationChain, address recipient) external payable returns (uint256)",
  "function transferInvoice(uint8 destinationChain, uint256 invoiceId) external payable returns (uint256)",
  "function transferCreditScore(uint8 destinationChain, address subject) external payable returns (uint256)",
  "function getTransactionStatus(uint256 txId) external view returns (uint8)",
  "event CrossChainTransferInitiated(uint256 indexed txId, uint8 fromChain, uint8 toChain, address indexed user, uint8 assetType, uint256 amount)",
  "event CrossChainTransferCompleted(uint256 indexed txId, uint8 fromChain, uint8 toChain, address indexed user, uint8 assetType, uint256 amount)",
];

class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private invoiceTokenContract: ethers.Contract | null = null;
  private marketplaceContract: ethers.Contract | null = null;
  private unifiedLedgerContract: ethers.Contract | null = null;

  // Contract addresses (should be from environment variables)
  private readonly CONTRACT_ADDRESSES = {
    invoiceToken: import.meta.env.VITE_INVOICE_TOKEN_ADDRESS || "0x...",
    marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x...",
    unifiedLedger: import.meta.env.VITE_UNIFIED_LEDGER_ADDRESS || "0x...",
  };

  // Network configuration
  private readonly NETWORK_CONFIG = {
    chainId: import.meta.env.VITE_CHAIN_ID || "0x38", // BSC Mainnet
    rpcUrl: import.meta.env.VITE_RPC_URL || "https://bsc-dataseed.binance.org/",
  };

  async connectWallet(): Promise<boolean> {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask not installed");
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();

      // Initialize contracts
      await this.initializeContracts();

      return true;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return false;
    }
  }

  async initializeContracts(): Promise<void> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    this.invoiceTokenContract = new ethers.Contract(
      this.CONTRACT_ADDRESSES.invoiceToken,
      INVOICE_TOKEN_ABI,
      this.signer
    );

    this.marketplaceContract = new ethers.Contract(
      this.CONTRACT_ADDRESSES.marketplace,
      MARKETPLACE_ABI,
      this.signer
    );

    this.unifiedLedgerContract = new ethers.Contract(
      this.CONTRACT_ADDRESSES.unifiedLedger,
      UNIFIED_LEDGER_ABI,
      this.signer
    );
  }

  async getAccount(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  async getBalance(): Promise<string> {
    if (!this.signer) return "0";
    const balance = await this.signer.getBalance();
    return ethers.utils.formatEther(balance);
  }

  // Invoice Token Contract Methods
  async tokenizeInvoice(invoiceData: {
    invoiceId: string;
    totalValue: string;
    totalShares: number;
    dueDate: number;
    debtor: string;
    ipfsHash: string;
    industry: string;
    riskRating: number;
    interestRate: number;
  }): Promise<string> {
    if (!this.invoiceTokenContract) {
      throw new Error("Contract not initialized");
    }

    const verificationFee = ethers.utils.parseEther("0.01");

    const tx = await this.invoiceTokenContract.tokenizeInvoice(
      invoiceData.invoiceId,
      ethers.utils.parseEther(invoiceData.totalValue),
      invoiceData.totalShares,
      invoiceData.dueDate,
      invoiceData.debtor,
      invoiceData.ipfsHash,
      invoiceData.industry,
      invoiceData.riskRating,
      invoiceData.interestRate,
      { value: verificationFee }
    );

    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getInvoice(tokenId: number): Promise<any> {
    if (!this.invoiceTokenContract) {
      throw new Error("Contract not initialized");
    }

    return await this.invoiceTokenContract.getInvoice(tokenId);
  }

  async verifyInvoice(tokenId: number): Promise<string> {
    if (!this.invoiceTokenContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.invoiceTokenContract.verifyInvoice(tokenId);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async markInvoicePaid(tokenId: number, paidAmount: string): Promise<string> {
    if (!this.invoiceTokenContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.invoiceTokenContract.markInvoicePaid(
      tokenId,
      ethers.utils.parseEther(paidAmount)
    );
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getTokenBalance(tokenId: number, address: string): Promise<number> {
    if (!this.invoiceTokenContract) {
      throw new Error("Contract not initialized");
    }

    const balance = await this.invoiceTokenContract.balanceOf(address, tokenId);
    return balance.toNumber();
  }

  // Marketplace Contract Methods
  async listToken(
    tokenId: number,
    price: string,
    duration: number
  ): Promise<string> {
    if (!this.marketplaceContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.marketplaceContract.listToken(
      tokenId,
      ethers.utils.parseEther(price),
      duration
    );
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async buyToken(tokenId: number, price: string): Promise<string> {
    if (!this.marketplaceContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.marketplaceContract.buyToken(tokenId, {
      value: ethers.utils.parseEther(price),
    });
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async placeBid(tokenId: number, amount: string): Promise<string> {
    if (!this.marketplaceContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.marketplaceContract.placeBid(tokenId, {
      value: ethers.utils.parseEther(amount),
    });
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async acceptBid(tokenId: number): Promise<string> {
    if (!this.marketplaceContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.marketplaceContract.acceptBid(tokenId);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getListing(tokenId: number): Promise<any> {
    if (!this.marketplaceContract) {
      throw new Error("Contract not initialized");
    }

    return await this.marketplaceContract.getListing(tokenId);
  }

  // Unified Ledger Methods
  async initiateNativeTransfer(
    destinationChain: number,
    recipient: string,
    amount: string
  ): Promise<string> {
    if (!this.unifiedLedgerContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.unifiedLedgerContract.initiateNativeTransfer(
      destinationChain,
      recipient,
      { value: ethers.utils.parseEther(amount) }
    );
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async transferInvoice(
    destinationChain: number,
    invoiceId: number
  ): Promise<string> {
    if (!this.unifiedLedgerContract) {
      throw new Error("Contract not initialized");
    }

    const tx = await this.unifiedLedgerContract.transferInvoice(
      destinationChain,
      invoiceId,
      { value: ethers.utils.parseEther("0.001") } // Gas fee
    );
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  async getTransactionStatus(txId: number): Promise<number> {
    if (!this.unifiedLedgerContract) {
      throw new Error("Contract not initialized");
    }

    return await this.unifiedLedgerContract.getTransactionStatus(txId);
  }

  // Event Listeners
  onInvoiceTokenized(
    callback: (
      tokenId: number,
      invoiceId: string,
      issuer: string,
      totalValue: string,
      totalShares: number,
      dueDate: number
    ) => void
  ) {
    if (!this.invoiceTokenContract) return;

    this.invoiceTokenContract.on("InvoiceTokenized", callback);
  }

  onInvoiceVerified(callback: (tokenId: number, verifier: string) => void) {
    if (!this.invoiceTokenContract) return;

    this.invoiceTokenContract.on("InvoiceVerified", callback);
  }

  onTokenListed(
    callback: (
      tokenId: number,
      seller: string,
      price: string,
      expiresAt: number
    ) => void
  ) {
    if (!this.marketplaceContract) return;

    this.marketplaceContract.on("TokenListed", callback);
  }

  onTokenSold(
    callback: (
      tokenId: number,
      seller: string,
      buyer: string,
      price: string
    ) => void
  ) {
    if (!this.marketplaceContract) return;

    this.marketplaceContract.on("TokenSold", callback);
  }

  // Utility Methods
  formatEther(wei: string): string {
    return ethers.utils.formatEther(wei);
  }

  parseEther(ether: string): string {
    return ethers.utils.parseEther(ether).toString();
  }

  async switchNetwork(): Promise<boolean> {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: this.NETWORK_CONFIG.chainId }],
      });
      return true;
    } catch (error) {
      console.error("Failed to switch network:", error);
      return false;
    }
  }

  async addNetwork(): Promise<boolean> {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: this.NETWORK_CONFIG.chainId,
            chainName: "Binance Smart Chain",
            rpcUrls: [this.NETWORK_CONFIG.rpcUrl],
            nativeCurrency: {
              name: "BNB",
              symbol: "BNB",
              decimals: 18,
            },
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Failed to add network:", error);
      return false;
    }
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;
