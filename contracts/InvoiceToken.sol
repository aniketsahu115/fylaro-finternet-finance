// Smart contract for invoice tokenization with fractional ownership
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title InvoiceToken
 * @dev ERC1155 contract for tokenizing invoices with fractional ownership on the Finternet
 */
contract InvoiceToken is ERC1155, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct Invoice {
        uint256 totalValue;
        uint256 totalShares;
        uint256 dueDate;
        address issuer;
        address debtor;
        string invoiceId;
        string ipfsHash;
        bool isVerified;
        bool isPaid;
        uint256 creditScore;
        string industry;
        uint256 createdAt;
        uint256 maturityDate;
        uint8 riskRating; // 1-10 scale
        uint256 interestRate; // Basis points (e.g., 500 = 5%)
    }
    
    mapping(uint256 => Invoice) public invoices;
    mapping(string => uint256) public invoiceIdToTokenId;
    mapping(address => bool) public verifiedIssuers;
    mapping(address => uint256) public creditScores;
    mapping(uint256 => mapping(address => uint256)) public shareholderVotes;
    mapping(uint256 => uint256) public totalVotes;
    
    // Fee structure
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public verificationFee = 0.01 ether;
    address public feeRecipient;
    
    event InvoiceTokenized(
        uint256 indexed tokenId,
        string invoiceId,
        address indexed issuer,
        uint256 totalValue,
        uint256 totalShares,
        uint256 dueDate
    );
    
    event InvoiceVerified(uint256 indexed tokenId, address verifier);
    event InvoicePaid(uint256 indexed tokenId, uint256 amount, uint256 timestamp);
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event SharesTraded(uint256 indexed tokenId, address from, address to, uint256 amount);
    event VoteCast(uint256 indexed tokenId, address voter, uint256 shares, bool approval);
    event PaymentDistributed(uint256 indexed tokenId, uint256 totalAmount);
    
    modifier onlyVerifiedIssuer() {
        require(verifiedIssuers[msg.sender], "Not a verified issuer");
        _;
    }
    
    modifier onlyTokenExists(uint256 tokenId) {
        require(bytes(invoices[tokenId].invoiceId).length > 0, "Token does not exist");
        _;
    }
    
    constructor(string memory uri, address _feeRecipient) ERC1155(uri) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Tokenize an invoice with fractional ownership
     */
    function tokenizeInvoice(
        string memory _invoiceId,
        uint256 _totalValue,
        uint256 _totalShares,
        uint256 _dueDate,
        address _debtor,
        string memory _ipfsHash,
        string memory _industry,
        uint8 _riskRating,
        uint256 _interestRate
    ) external payable onlyVerifiedIssuer whenNotPaused nonReentrant {
        require(msg.value >= verificationFee, "Insufficient verification fee");
        require(_totalValue > 0, "Invalid total value");
        require(_totalShares > 0 && _totalShares <= 10000, "Invalid share count");
        require(_dueDate > block.timestamp, "Invalid due date");
        require(_debtor != address(0), "Invalid debtor address");
        require(_riskRating >= 1 && _riskRating <= 10, "Invalid risk rating");
        require(invoiceIdToTokenId[_invoiceId] == 0, "Invoice already tokenized");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        invoices[tokenId] = Invoice({
            totalValue: _totalValue,
            totalShares: _totalShares,
            dueDate: _dueDate,
            issuer: msg.sender,
            debtor: _debtor,
            invoiceId: _invoiceId,
            ipfsHash: _ipfsHash,
            isVerified: false,
            isPaid: false,
            creditScore: creditScores[msg.sender],
            industry: _industry,
            createdAt: block.timestamp,
            maturityDate: _dueDate,
            riskRating: _riskRating,
            interestRate: _interestRate
        });
        
        invoiceIdToTokenId[_invoiceId] = tokenId;
        
        // Mint all shares to the issuer initially
        _mint(msg.sender, tokenId, _totalShares, "");
        
        // Transfer verification fee
        payable(feeRecipient).transfer(msg.value);
        
        emit InvoiceTokenized(tokenId, _invoiceId, msg.sender, _totalValue, _totalShares, _dueDate);
    }
    
    /**
     * @dev Verify an invoice (admin function)
     */
    function verifyInvoice(uint256 tokenId) external onlyOwner onlyTokenExists(tokenId) {
        require(!invoices[tokenId].isVerified, "Invoice already verified");
        
        invoices[tokenId].isVerified = true;
        emit InvoiceVerified(tokenId, msg.sender);
    }
    
    /**
     * @dev Mark invoice as paid and distribute payments
     */
    function markInvoicePaid(uint256 tokenId, uint256 paidAmount) 
        external 
        onlyTokenExists(tokenId) 
        nonReentrant 
    {
        Invoice storage invoice = invoices[tokenId];
        require(!invoice.isPaid, "Invoice already paid");
        require(msg.sender == invoice.debtor || msg.sender == owner(), "Unauthorized");
        require(paidAmount > 0, "Invalid payment amount");
        
        invoice.isPaid = true;
        
        // Update credit score for issuer (positive payment)
        _updateCreditScore(invoice.issuer, true, paidAmount, invoice.totalValue);
        
        emit InvoicePaid(tokenId, paidAmount, block.timestamp);
        emit PaymentDistributed(tokenId, paidAmount);
    }
    
    /**
     * @dev Transfer shares with platform fee
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(invoices[id].isVerified, "Invoice not verified");
        
        // Calculate platform fee
        uint256 fee = (amount * platformFee) / 10000;
        uint256 transferAmount = amount - fee;
        
        // Transfer shares minus fee
        super.safeTransferFrom(from, to, id, transferAmount, data);
        
        // Transfer fee to platform
        if (fee > 0) {
            super.safeTransferFrom(from, feeRecipient, id, fee, data);
        }
        
        emit SharesTraded(id, from, to, transferAmount);
    }
    
    /**
     * @dev Batch transfer shares with platform fee
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        require(ids.length == amounts.length, "Arrays length mismatch");
        
        uint256[] memory transferAmounts = new uint256[](amounts.length);
        uint256[] memory feeAmounts = new uint256[](amounts.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            require(invoices[ids[i]].isVerified, "Invoice not verified");
            
            uint256 fee = (amounts[i] * platformFee) / 10000;
            transferAmounts[i] = amounts[i] - fee;
            feeAmounts[i] = fee;
        }
        
        // Transfer shares minus fees
        super.safeBatchTransferFrom(from, to, ids, transferAmounts, data);
        
        // Transfer fees to platform
        super.safeBatchTransferFrom(from, feeRecipient, ids, feeAmounts, data);
        
        for (uint256 i = 0; i < ids.length; i++) {
            emit SharesTraded(ids[i], from, to, transferAmounts[i]);
        }
    }
    
    /**
     * @dev Vote on invoice decisions (governance)
     */
    function vote(uint256 tokenId, bool approval) external onlyTokenExists(tokenId) {
        uint256 shareholderBalance = balanceOf(msg.sender, tokenId);
        require(shareholderBalance > 0, "Must own shares to vote");
        require(shareholderVotes[tokenId][msg.sender] == 0, "Already voted");
        
        shareholderVotes[tokenId][msg.sender] = shareholderBalance;
        if (approval) {
            totalVotes[tokenId] += shareholderBalance;
        }
        
        emit VoteCast(tokenId, msg.sender, shareholderBalance, approval);
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 tokenId) external view returns (Invoice memory) {
        return invoices[tokenId];
    }
    
    /**
     * @dev Get voting results
     */
    function getVotingResults(uint256 tokenId) external view returns (uint256 approvalVotes, uint256 totalSharesVoted) {
        Invoice memory invoice = invoices[tokenId];
        return (totalVotes[tokenId], totalSharesVoted);
    }
    
    /**
     * @dev Calculate yield for shareholders
     */
    function calculateYield(uint256 tokenId, address shareholder) external view returns (uint256) {
        Invoice memory invoice = invoices[tokenId];
        if (!invoice.isPaid) return 0;
        
        uint256 shares = balanceOf(shareholder, tokenId);
        uint256 sharePercentage = (shares * 10000) / invoice.totalShares;
        uint256 baseReturn = (invoice.totalValue * sharePercentage) / 10000;
        uint256 interest = (baseReturn * invoice.interestRate) / 10000;
        
        return baseReturn + interest;
    }
    
    /**
     * @dev Update credit score
     */
    function _updateCreditScore(address user, bool positive, uint256 amount, uint256 totalValue) internal {
        uint256 currentScore = creditScores[user];
        uint256 impact = (amount * 100) / totalValue; // Percentage impact
        
        if (positive) {
            creditScores[user] = _min(850, currentScore + impact);
        } else {
            creditScores[user] = _max(300, currentScore - impact);
        }
        
        emit CreditScoreUpdated(user, creditScores[user]);
    }
    
    /**
     * @dev Add verified issuer
     */
    function addVerifiedIssuer(address issuer) external onlyOwner {
        verifiedIssuers[issuer] = true;
        if (creditScores[issuer] == 0) {
            creditScores[issuer] = 650; // Starting credit score
        }
    }
    
    /**
     * @dev Remove verified issuer
     */
    function removeVerifiedIssuer(address issuer) external onlyOwner {
        verifiedIssuers[issuer] = false;
    }
    
    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
    
    /**
     * @dev Update verification fee
     */
    function updateVerificationFee(uint256 newFee) external onlyOwner {
        verificationFee = newFee;
    }
    
    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Utility functions
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
    
    constructor() ERC721("Fylaro Invoice Token", "FIT") {}
    
    /**
     * @dev Tokenize an invoice
     */
    function tokenizeInvoice(
        uint256 _amount,
        uint256 _dueDate,
        address _debtor,
        string memory _invoiceId,
        string memory _industry,
        string memory _metadataURI
    ) public onlyVerifiedIssuer returns (uint256) {
        require(_amount > 0, "Invalid amount");
        require(_dueDate > block.timestamp, "Invalid due date");
        require(invoiceIdToTokenId[_invoiceId] == 0, "Invoice already tokenized");
        
        uint256 tokenId = _nextTokenId++;
        
        invoices[tokenId] = Invoice({
            amount: _amount,
            dueDate: _dueDate,
            issuer: msg.sender,
            debtor: _debtor,
            invoiceId: _invoiceId,
            isVerified: false,
            isPaid: false,
            creditScore: creditScores[msg.sender],
            industry: _industry,
            metadataURI: _metadataURI
        });
        
        invoiceIdToTokenId[_invoiceId] = tokenId;
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _metadataURI);
        
        emit InvoiceTokenized(tokenId, _invoiceId, msg.sender, _amount, _dueDate);
        
        return tokenId;
    }
    
    /**
     * @dev Verify an invoice (only owner can verify)
     */
    function verifyInvoice(uint256 _tokenId) public onlyOwner {
        require(_exists(_tokenId), "Token does not exist");
        invoices[_tokenId].isVerified = true;
        emit InvoiceVerified(_tokenId);
    }
    
    /**
     * @dev Mark invoice as paid
     */
    function markInvoicePaid(uint256 _tokenId) public {
        require(_exists(_tokenId), "Token does not exist");
        require(
            msg.sender == invoices[_tokenId].debtor || 
            msg.sender == owner(),
            "Not authorized"
        );
        
        invoices[_tokenId].isPaid = true;
        emit InvoicePaid(_tokenId, block.timestamp);
        
        // Update credit score
        _updateCreditScore(invoices[_tokenId].issuer, 10);
    }
    
    /**
     * @dev Add verified issuer
     */
    function addVerifiedIssuer(address _issuer) public onlyOwner {
        verifiedIssuers[_issuer] = true;
        if (creditScores[_issuer] == 0) {
            creditScores[_issuer] = 500; // Starting credit score
        }
    }
    
    /**
     * @dev Remove verified issuer
     */
    function removeVerifiedIssuer(address _issuer) public onlyOwner {
        verifiedIssuers[_issuer] = false;
    }
    
    /**
     * @dev Update credit score
     */
    function _updateCreditScore(address _user, uint256 _points) internal {
        creditScores[_user] = creditScores[_user] + _points;
        if (creditScores[_user] > 1000) {
            creditScores[_user] = 1000;
        }
        emit CreditScoreUpdated(_user, creditScores[_user]);
    }
    
    /**
     * @dev Get invoice details
     */
    function getInvoice(uint256 _tokenId) public view returns (Invoice memory) {
        require(_exists(_tokenId), "Token does not exist");
        return invoices[_tokenId];
    }
    
    /**
     * @dev Check if invoice is overdue
     */
    function isOverdue(uint256 _tokenId) public view returns (bool) {
        require(_exists(_tokenId), "Token does not exist");
        return block.timestamp > invoices[_tokenId].dueDate && !invoices[_tokenId].isPaid;
    }
    
    /**
     * @dev Get user's credit score
     */
    function getCreditScore(address _user) public view returns (uint256) {
        return creditScores[_user];
    }
    
    // Override required by Solidity
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}