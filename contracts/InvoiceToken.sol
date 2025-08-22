// Smart contract for invoice tokenization
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title InvoiceToken
 * @dev NFT contract for tokenizing invoices on the Finternet
 */
contract InvoiceToken is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    struct Invoice {
        uint256 amount;
        uint256 dueDate;
        address issuer;
        address debtor;
        string invoiceId;
        bool isVerified;
        bool isPaid;
        uint256 creditScore;
        string industry;
        string metadataURI;
    }
    
    mapping(uint256 => Invoice) public invoices;
    mapping(string => uint256) public invoiceIdToTokenId;
    mapping(address => bool) public verifiedIssuers;
    mapping(address => uint256) public creditScores;
    
    event InvoiceTokenized(
        uint256 indexed tokenId,
        string invoiceId,
        address indexed issuer,
        uint256 amount,
        uint256 dueDate
    );
    
    event InvoiceVerified(uint256 indexed tokenId);
    event InvoicePaid(uint256 indexed tokenId, uint256 timestamp);
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    
    modifier onlyVerifiedIssuer() {
        require(verifiedIssuers[msg.sender], "Not a verified issuer");
        _;
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