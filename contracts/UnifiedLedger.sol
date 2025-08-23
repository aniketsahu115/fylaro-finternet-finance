// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./InvoiceToken.sol";
import "./CreditScoring.sol";

/**
 * @title UnifiedLedger
 * @dev Simulates Finternet's unified ledger for cross-chain asset transfers and interoperability
 */
contract UnifiedLedger is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // Roles
    bytes32 public constant RELAY_ROLE = keccak256("RELAY_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant FINTERNET_VALIDATOR = keccak256("FINTERNET_VALIDATOR");
    
    // Supported chains
    enum ChainId {
        Ethereum,      // 1
        Polygon,       // 137
        Arbitrum,      // 42161
        Optimism,      // 10
        BNBChain,      // 56
        Avalanche,     // 43114
        Base,          // 8453
        zkSync,        // 324
        Linea,         // 59144
        Scroll         // 534352
    }
    
    // Asset types
    enum AssetType {
        NativeToken,   // ETH, MATIC, etc.
        ERC20Token,    // USDC, DAI, etc.
        InvoiceToken,  // Fylaro invoice tokens
        DebtPosition,  // Debt position on different chain
        LiquidityPool, // LP position
        CreditScore    // Credit score data
    }
    
    // Transaction status
    enum TransactionStatus {
        Pending,
        Confirmed,
        Failed,
        Reverted
    }
    
    // Cross-chain transaction record
    struct CrossChainTx {
        uint256 txId;
        ChainId sourceChain;
        ChainId destinationChain;
        address sender;
        address recipient;
        AssetType assetType;
        address assetAddress; // Address of the asset on source chain
        uint256 amount;
        uint256 fee;
        uint256 nonce;
        bytes32 messageHash;
        bytes signature;
        uint256 timestamp;
        TransactionStatus status;
        string externalTxId; // External transaction ID for reference
    }
    
    // Chain configuration
    struct ChainConfig {
        bool enabled;
        uint256 confirmations;
        uint256 baseFee;
        uint256 gasPrice;
        address bridgeContract;
        string rpcEndpoint;
    }
    
    // Credit score transfer record
    struct CreditTransfer {
        uint256 transferId;
        address subject;
        ChainId sourceChain;
        ChainId destinationChain;
        uint256 creditScore;
        uint256 timestamp;
        bool confirmed;
        bytes32 attestation;
    }
    
    // Invoice transfer record
    struct InvoiceTransfer {
        uint256 transferId;
        uint256 invoiceId;
        ChainId sourceChain;
        ChainId destinationChain;
        address issuer;
        uint256 faceValue;
        uint256 dueDate;
        bool verified;
        uint256 timestamp;
        bytes32 attestation;
    }
    
    // Mappings
    mapping(ChainId => ChainConfig) public chainConfigs;
    mapping(uint256 => CrossChainTx) public transactions;
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => mapping(ChainId => uint256[])) public userTransactions;
    mapping(address => mapping(ChainId => mapping(address => uint256))) public tokenBalances;
    mapping(uint256 => CreditTransfer) public creditTransfers;
    mapping(uint256 => InvoiceTransfer) public invoiceTransfers;
    
    // State variables
    uint256 public txCount;
    uint256 public creditTransferCount;
    uint256 public invoiceTransferCount;
    uint256 public baseFee = 0.001 ether;
    uint256 public minValidators = 3;
    bool public paused;
    
    // External contract references
    InvoiceToken public invoiceToken;
    CreditScoring public creditScoring;
    
    // Events
    event CrossChainTransactionInitiated(uint256 indexed txId, ChainId sourceChain, ChainId destinationChain, address sender, address recipient, uint256 amount);
    event CrossChainTransactionCompleted(uint256 indexed txId, TransactionStatus status);
    event MessageReceived(bytes32 indexed messageHash, ChainId sourceChain, address sender);
    event MessageProcessed(bytes32 indexed messageHash, bool success);
    event CreditScoreTransferred(uint256 indexed transferId, address subject, ChainId sourceChain, ChainId destinationChain, uint256 creditScore);
    event InvoiceTransferred(uint256 indexed transferId, uint256 invoiceId, ChainId sourceChain, ChainId destinationChain);
    event ChainConfigUpdated(ChainId indexed chainId, bool enabled);
    event TokensMinted(address indexed user, ChainId indexed chainId, address token, uint256 amount);
    event TokensBurned(address indexed user, ChainId indexed chainId, address token, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _invoiceToken Address of the InvoiceToken contract
     * @param _creditScoring Address of the CreditScoring contract
     */
    constructor(address _invoiceToken, address _creditScoring) {
        require(_invoiceToken != address(0), "Invalid invoice token address");
        require(_creditScoring != address(0), "Invalid credit scoring address");
        
        invoiceToken = InvoiceToken(_invoiceToken);
        creditScoring = CreditScoring(_creditScoring);
        
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RELAY_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);
        _setupRole(FINTERNET_VALIDATOR, msg.sender);
        
        // Configure default chains
        _setupChainConfig(ChainId.Ethereum, true, 12, 0.001 ether, 30 gwei, address(0), "https://ethereum.rpc.endpoint");
        _setupChainConfig(ChainId.Polygon, true, 128, 0.0005 ether, 50 gwei, address(0), "https://polygon.rpc.endpoint");
        _setupChainConfig(ChainId.Arbitrum, true, 10, 0.0002 ether, 0.1 gwei, address(0), "https://arbitrum.rpc.endpoint");
    }
    
    /**
     * @dev Setup chain configuration
     */
    function _setupChainConfig(
        ChainId chainId,
        bool enabled,
        uint256 confirmations,
        uint256 fee,
        uint256 gasPrice,
        address bridgeContract,
        string memory rpcEndpoint
    ) internal {
        ChainConfig storage config = chainConfigs[chainId];
        config.enabled = enabled;
        config.confirmations = confirmations;
        config.baseFee = fee;
        config.gasPrice = gasPrice;
        config.bridgeContract = bridgeContract;
        config.rpcEndpoint = rpcEndpoint;
        
        emit ChainConfigUpdated(chainId, enabled);
    }
    
    /**
     * @dev Modifier to check if the chain is supported
     */
    modifier onlySupportedChain(ChainId chainId) {
        require(chainConfigs[chainId].enabled, "Chain not supported");
        _;
    }
    
    /**
     * @dev Modifier to check if the contract is not paused
     */
    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    /**
     * @dev Initiate cross-chain transfer of native tokens
     * @param destinationChain The destination chain ID
     * @param recipient The recipient address on the destination chain
     * @return txId The transaction ID
     */
    function initiateNativeTransfer(
        ChainId destinationChain,
        address recipient
    ) external payable nonReentrant notPaused onlySupportedChain(destinationChain) returns (uint256 txId) {
        require(msg.value > baseFee, "Insufficient value sent");
        require(recipient != address(0), "Invalid recipient");
        
        // Calculate the actual amount to transfer (minus fee)
        uint256 transferAmount = msg.value - baseFee;
        
        // Create transaction record
        txId = ++txCount;
        uint256 nonce = _generateNonce(msg.sender);
        
        CrossChainTx memory tx = CrossChainTx({
            txId: txId,
            sourceChain: ChainId.Ethereum, // Assuming this contract is on Ethereum
            destinationChain: destinationChain,
            sender: msg.sender,
            recipient: recipient,
            assetType: AssetType.NativeToken,
            assetAddress: address(0),
            amount: transferAmount,
            fee: baseFee,
            nonce: nonce,
            messageHash: bytes32(0),
            signature: bytes(""),
            timestamp: block.timestamp,
            status: TransactionStatus.Pending,
            externalTxId: ""
        });
        
        // Calculate message hash
        bytes32 messageHash = _hashTransaction(tx);
        tx.messageHash = messageHash;
        
        // Store transaction
        transactions[txId] = tx;
        userTransactions[msg.sender][destinationChain].push(txId);
        
        emit CrossChainTransactionInitiated(txId, ChainId.Ethereum, destinationChain, msg.sender, recipient, transferAmount);
        
        return txId;
    }
    
    /**
     * @dev Initiate cross-chain transfer of ERC20 tokens
     * @param destinationChain The destination chain ID
     * @param recipient The recipient address on the destination chain
     * @param token The token address
     * @param amount The amount to transfer
     * @return txId The transaction ID
     */
    function initiateTokenTransfer(
        ChainId destinationChain,
        address recipient,
        address token,
        uint256 amount
    ) external payable nonReentrant notPaused onlySupportedChain(destinationChain) returns (uint256 txId) {
        require(msg.value >= baseFee, "Insufficient fee");
        require(recipient != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer tokens to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create transaction record
        txId = ++txCount;
        uint256 nonce = _generateNonce(msg.sender);
        
        CrossChainTx memory tx = CrossChainTx({
            txId: txId,
            sourceChain: ChainId.Ethereum, // Assuming this contract is on Ethereum
            destinationChain: destinationChain,
            sender: msg.sender,
            recipient: recipient,
            assetType: AssetType.ERC20Token,
            assetAddress: token,
            amount: amount,
            fee: msg.value,
            nonce: nonce,
            messageHash: bytes32(0),
            signature: bytes(""),
            timestamp: block.timestamp,
            status: TransactionStatus.Pending,
            externalTxId: ""
        });
        
        // Calculate message hash
        bytes32 messageHash = _hashTransaction(tx);
        tx.messageHash = messageHash;
        
        // Store transaction
        transactions[txId] = tx;
        userTransactions[msg.sender][destinationChain].push(txId);
        
        emit CrossChainTransactionInitiated(txId, ChainId.Ethereum, destinationChain, msg.sender, recipient, amount);
        
        return txId;
    }
    
    /**
     * @dev Initiate cross-chain transfer of an invoice
     * @param destinationChain The destination chain ID
     * @param invoiceId The invoice ID
     * @return transferId The transfer ID
     */
    function transferInvoice(
        ChainId destinationChain,
        uint256 invoiceId
    ) external payable nonReentrant notPaused onlySupportedChain(destinationChain) returns (uint256 transferId) {
        require(msg.value >= baseFee, "Insufficient fee");
        
        // Verify invoice ownership
        (address issuer, uint256 faceValue, bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(issuer == msg.sender, "Not invoice owner");
        require(isVerified, "Invoice not verified");
        
        // Create invoice transfer record
        transferId = ++invoiceTransferCount;
        
        InvoiceTransfer memory transfer = InvoiceTransfer({
            transferId: transferId,
            invoiceId: invoiceId,
            sourceChain: ChainId.Ethereum, // Assuming this contract is on Ethereum
            destinationChain: destinationChain,
            issuer: msg.sender,
            faceValue: faceValue,
            dueDate: invoiceToken.getInvoiceDueDate(invoiceId),
            verified: isVerified,
            timestamp: block.timestamp,
            attestation: bytes32(0)
        });
        
        // Generate attestation
        bytes32 attestation = _attestInvoiceTransfer(transfer);
        transfer.attestation = attestation;
        
        // Store transfer
        invoiceTransfers[transferId] = transfer;
        
        // Lock the invoice on this chain
        invoiceToken.lockInvoice(invoiceId);
        
        emit InvoiceTransferred(transferId, invoiceId, ChainId.Ethereum, destinationChain);
        
        return transferId;
    }
    
    /**
     * @dev Transfer credit score to another chain
     * @param destinationChain The destination chain ID
     * @param subject The subject address
     * @return transferId The transfer ID
     */
    function transferCreditScore(
        ChainId destinationChain,
        address subject
    ) external payable nonReentrant notPaused onlySupportedChain(destinationChain) returns (uint256 transferId) {
        require(msg.value >= baseFee, "Insufficient fee");
        require(subject != address(0), "Invalid subject");
        
        // Get credit score from the credit scoring contract
        uint256 score = creditScoring.getCreditScore(subject);
        require(score > 0, "No credit score available");
        
        // Create credit transfer record
        transferId = ++creditTransferCount;
        
        CreditTransfer memory transfer = CreditTransfer({
            transferId: transferId,
            subject: subject,
            sourceChain: ChainId.Ethereum, // Assuming this contract is on Ethereum
            destinationChain: destinationChain,
            creditScore: score,
            timestamp: block.timestamp,
            confirmed: false,
            attestation: bytes32(0)
        });
        
        // Generate attestation
        bytes32 attestation = _attestCreditTransfer(transfer);
        transfer.attestation = attestation;
        
        // Store transfer
        creditTransfers[transferId] = transfer;
        
        emit CreditScoreTransferred(transferId, subject, ChainId.Ethereum, destinationChain, score);
        
        return transferId;
    }
    
    /**
     * @dev Receive message from relay
     * @param sourceChain The source chain ID
     * @param sender The sender address on the source chain
     * @param message The message data
     * @param signature The signature of the message
     * @return success Whether the message was processed successfully
     */
    function receiveMessage(
        ChainId sourceChain,
        address sender,
        bytes calldata message,
        bytes calldata signature
    ) external onlyRole(RELAY_ROLE) nonReentrant returns (bool success) {
        bytes32 messageHash = keccak256(abi.encodePacked(sourceChain, sender, message));
        
        // Verify message hasn't been processed
        require(!processedMessages[messageHash], "Message already processed");
        
        // Verify signature
        address signer = _recoverSigner(messageHash, signature);
        require(hasRole(FINTERNET_VALIDATOR, signer), "Invalid signature");
        
        // Mark message as processed
        processedMessages[messageHash] = true;
        
        emit MessageReceived(messageHash, sourceChain, sender);
        
        // Process message based on type
        // For this demonstration, we'll just emit an event
        emit MessageProcessed(messageHash, true);
        
        return true;
    }
    
    /**
     * @dev Complete cross-chain transaction (called by relay)
     * @param txId The transaction ID
     * @param status The transaction status
     * @param externalTxId The external transaction ID
     * @param signatures Array of validator signatures
     * @return success Whether the transaction was completed successfully
     */
    function completeTransaction(
        uint256 txId,
        TransactionStatus status,
        string calldata externalTxId,
        bytes[] calldata signatures
    ) external onlyRole(RELAY_ROLE) nonReentrant returns (bool success) {
        require(txId > 0 && txId <= txCount, "Invalid transaction ID");
        
        CrossChainTx storage tx = transactions[txId];
        require(tx.status == TransactionStatus.Pending, "Transaction not pending");
        
        // Verify signatures
        bytes32 messageHash = keccak256(abi.encodePacked(txId, status, externalTxId));
        require(signatures.length >= minValidators, "Insufficient validator signatures");
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(hasRole(FINTERNET_VALIDATOR, signer), "Invalid signature");
        }
        
        // Update transaction status
        tx.status = status;
        tx.externalTxId = externalTxId;
        
        emit CrossChainTransactionCompleted(txId, status);
        
        return true;
    }
    
    /**
     * @dev Receive tokens on destination chain (minting)
     * @param user The user address
     * @param sourceChain The source chain ID
     * @param token The token address on this chain
     * @param amount The amount to mint
     * @param nonce The transaction nonce
     * @param signatures Array of validator signatures
     * @return success Whether the tokens were received successfully
     */
    function receiveTokens(
        address user,
        ChainId sourceChain,
        address token,
        uint256 amount,
        uint256 nonce,
        bytes[] calldata signatures
    ) external onlyRole(RELAY_ROLE) nonReentrant returns (bool success) {
        require(user != address(0), "Invalid user");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be greater than 0");
        
        // Verify signatures
        bytes32 messageHash = keccak256(abi.encodePacked(user, sourceChain, token, amount, nonce));
        require(signatures.length >= minValidators, "Insufficient validator signatures");
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(hasRole(FINTERNET_VALIDATOR, signer), "Invalid signature");
        }
        
        // Update token balance (simulated minting)
        tokenBalances[user][sourceChain][token] += amount;
        
        emit TokensMinted(user, sourceChain, token, amount);
        
        return true;
    }
    
    /**
     * @dev Create invoice on destination chain
     * @param transferId The transfer ID
     * @param signatures Array of validator signatures
     * @return newInvoiceId The new invoice ID on this chain
     */
    function createInvoiceOnDestination(
        uint256 transferId,
        bytes[] calldata signatures
    ) external onlyRole(RELAY_ROLE) nonReentrant returns (uint256 newInvoiceId) {
        require(transferId > 0 && transferId <= invoiceTransferCount, "Invalid transfer ID");
        
        InvoiceTransfer storage transfer = invoiceTransfers[transferId];
        
        // Verify signatures
        bytes32 messageHash = keccak256(abi.encodePacked(
            transfer.transferId,
            transfer.invoiceId,
            transfer.sourceChain,
            transfer.destinationChain,
            transfer.issuer,
            transfer.faceValue,
            transfer.dueDate
        ));
        
        require(signatures.length >= minValidators, "Insufficient validator signatures");
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(hasRole(FINTERNET_VALIDATOR, signer), "Invalid signature");
        }
        
        // Create invoice on destination chain (mock implementation)
        // In a real implementation, this would create an actual invoice token
        newInvoiceId = invoiceToken.mintInvoice(
            transfer.issuer,
            transfer.faceValue,
            "Cross-chain invoice",
            transfer.dueDate,
            block.timestamp + 30 days
        );
        
        // Verify the new invoice
        invoiceToken.verifyInvoice(newInvoiceId);
        
        return newInvoiceId;
    }
    
    /**
     * @dev Set credit score on destination chain
     * @param transferId The transfer ID
     * @param signatures Array of validator signatures
     * @return success Whether the credit score was set successfully
     */
    function setCreditScoreOnDestination(
        uint256 transferId,
        bytes[] calldata signatures
    ) external onlyRole(RELAY_ROLE) nonReentrant returns (bool success) {
        require(transferId > 0 && transferId <= creditTransferCount, "Invalid transfer ID");
        
        CreditTransfer storage transfer = creditTransfers[transferId];
        require(!transfer.confirmed, "Credit transfer already confirmed");
        
        // Verify signatures
        bytes32 messageHash = keccak256(abi.encodePacked(
            transfer.transferId,
            transfer.subject,
            transfer.sourceChain,
            transfer.destinationChain,
            transfer.creditScore
        ));
        
        require(signatures.length >= minValidators, "Insufficient validator signatures");
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(hasRole(FINTERNET_VALIDATOR, signer), "Invalid signature");
        }
        
        // Set credit score on destination chain
        creditScoring.setCreditScore(transfer.subject, transfer.creditScore);
        
        // Mark as confirmed
        transfer.confirmed = true;
        
        return true;
    }
    
    /**
     * @dev Generate nonce for transaction
     * @param sender The sender address
     * @return nonce The generated nonce
     */
    function _generateNonce(address sender) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(sender, block.timestamp, txCount)));
    }
    
    /**
     * @dev Hash transaction data
     * @param tx The cross-chain transaction
     * @return hash The transaction hash
     */
    function _hashTransaction(CrossChainTx memory tx) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            tx.txId,
            tx.sourceChain,
            tx.destinationChain,
            tx.sender,
            tx.recipient,
            tx.assetType,
            tx.assetAddress,
            tx.amount,
            tx.nonce
        ));
    }
    
    /**
     * @dev Attest invoice transfer
     * @param transfer The invoice transfer
     * @return attestation The attestation hash
     */
    function _attestInvoiceTransfer(InvoiceTransfer memory transfer) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            transfer.transferId,
            transfer.invoiceId,
            transfer.sourceChain,
            transfer.destinationChain,
            transfer.issuer,
            transfer.faceValue,
            transfer.dueDate,
            transfer.timestamp
        ));
    }
    
    /**
     * @dev Attest credit transfer
     * @param transfer The credit transfer
     * @return attestation The attestation hash
     */
    function _attestCreditTransfer(CreditTransfer memory transfer) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            transfer.transferId,
            transfer.subject,
            transfer.sourceChain,
            transfer.destinationChain,
            transfer.creditScore,
            transfer.timestamp
        ));
    }
    
    /**
     * @dev Recover signer from signature
     * @param messageHash The message hash
     * @param signature The signature
     * @return signer The signer address
     */
    function _recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        return ethSignedMessageHash.recover(signature);
    }
    
    /**
     * @dev Update chain configuration
     * @param chainId The chain ID
     * @param enabled Whether the chain is enabled
     * @param confirmations The number of confirmations required
     * @param fee The base fee
     * @param gasPrice The gas price
     * @param bridgeContract The bridge contract address
     * @param rpcEndpoint The RPC endpoint
     */
    function updateChainConfig(
        ChainId chainId,
        bool enabled,
        uint256 confirmations,
        uint256 fee,
        uint256 gasPrice,
        address bridgeContract,
        string calldata rpcEndpoint
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setupChainConfig(chainId, enabled, confirmations, fee, gasPrice, bridgeContract, rpcEndpoint);
    }
    
    /**
     * @dev Set base fee
     * @param newBaseFee The new base fee
     */
    function setBaseFee(uint256 newBaseFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseFee = newBaseFee;
    }
    
    /**
     * @dev Set minimum validators
     * @param newMinValidators The new minimum validators
     */
    function setMinValidators(uint256 newMinValidators) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMinValidators > 0, "Min validators must be greater than 0");
        minValidators = newMinValidators;
    }
    
    /**
     * @dev Set pause state
     * @param newPaused The new pause state
     */
    function setPaused(bool newPaused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = newPaused;
    }
    
    /**
     * @dev Withdraw fees
     * @param amount The amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(msg.sender).transfer(amount);
    }
    
    /**
     * @dev Get transaction details
     * @param txId The transaction ID
     * @return tx The transaction details
     */
    function getTransaction(uint256 txId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        TransactionStatus status,
        ChainId sourceChain,
        ChainId destinationChain
    ) {
        require(txId > 0 && txId <= txCount, "Invalid transaction ID");
        
        CrossChainTx memory tx = transactions[txId];
        
        return (
            tx.sender,
            tx.recipient,
            tx.amount,
            tx.status,
            tx.sourceChain,
            tx.destinationChain
        );
    }
    
    /**
     * @dev Get user transactions
     * @param user The user address
     * @param chainId The chain ID
     * @return txIds The transaction IDs
     */
    function getUserTransactions(address user, ChainId chainId) external view returns (uint256[] memory) {
        return userTransactions[user][chainId];
    }
    
    /**
     * @dev Receive function to receive ETH
     */
    receive() external payable {
        // Accept ETH transfers
    }
}
