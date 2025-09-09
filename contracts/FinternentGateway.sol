// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./InvoiceToken.sol";
import "./Marketplace.sol";
import "./CreditScoring.sol";
import "./PaymentTracker.sol";
import "./UnifiedLedger.sol";
import "./RiskAssessment.sol";
import "./LiquidityPool.sol";

/**
 * @title FinternentGateway
 * @dev Central gateway for interacting with Finternet ecosystem
 */
contract FinternentGateway is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant REGISTRY_ROLE = keccak256("REGISTRY_ROLE");
    
    // Contract registry
    struct ContractInfo {
        address contractAddress;
        string contractType;
        string version;
        bool isActive;
        uint256 updatedAt;
    }
    
    // User registry
    struct UserInfo {
        address userAddress;
        string role; // "issuer", "investor", "verifier", "admin"
        bool isVerified;
        bool isActive;
        uint256 registeredAt;
        uint256 lastActiveAt;
    }
    
    // Fee configuration
    struct FeeConfig {
        string feeType;
        uint256 feeAmount; // In basis points or fixed amount
        bool isPercentage;
        address recipient;
    }
    
    // Contract references
    InvoiceToken public invoiceToken;
    Marketplace public marketplace;
    CreditScoring public creditScoring;
    PaymentTracker public paymentTracker;
    UnifiedLedger public unifiedLedger;
    RiskAssessment public riskAssessment;
    LiquidityPool public liquidityPool;
    
    // Stablecoin address
    address public stablecoin;
    
    // Mappings
    mapping(string => address) public contracts;
    mapping(address => UserInfo) public users;
    mapping(string => FeeConfig) public fees;
    
    // Events
    event ContractRegistered(string indexed contractType, address indexed contractAddress, string version);
    event ContractUpdated(string indexed contractType, address indexed contractAddress, string version);
    event UserRegistered(address indexed userAddress, string role, bool isVerified);
    event UserUpdated(address indexed userAddress, string role, bool isActive);
    event FeeConfigUpdated(string indexed feeType, uint256 feeAmount, bool isPercentage);
    event InvoiceProcessed(uint256 indexed invoiceId, address indexed issuer, string action);
    event CrossChainOperationInitiated(string operationType, address indexed initiator, uint256 indexed operationId);
    event FundsTransferred(address indexed from, address indexed to, uint256 amount, string purpose);
    
    /**
     * @dev Constructor
     * @param _stablecoin The stablecoin address
     */
    constructor(address _stablecoin) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        
        stablecoin = _stablecoin;
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANAGER_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        _setupRole(REGISTRY_ROLE, msg.sender);
        
        // Setup default fees
        _setupFee("issuance", 100, true, msg.sender); // 1%
        _setupFee("trading", 50, true, msg.sender); // 0.5%
        _setupFee("verification", 200, false, msg.sender); // Fixed fee in stablecoin units
        _setupFee("settlement", 25, true, msg.sender); // 0.25%
    }
    
    /**
     * @dev Setup fee configuration
     */
    function _setupFee(
        string memory feeType,
        uint256 feeAmount,
        bool isPercentage,
        address recipient
    ) internal {
        FeeConfig storage fee = fees[feeType];
        fee.feeType = feeType;
        fee.feeAmount = feeAmount;
        fee.isPercentage = isPercentage;
        fee.recipient = recipient;
        
        emit FeeConfigUpdated(feeType, feeAmount, isPercentage);
    }
    
    /**
     * @dev Register contract in the Finternet ecosystem
     * @param contractType The contract type
     * @param contractAddress The contract address
     * @param version The contract version
     * @return success Whether the registration was successful
     */
    function registerContract(
        string calldata contractType,
        address contractAddress,
        string calldata version
    ) external onlyRole(REGISTRY_ROLE) returns (bool success) {
        require(contractAddress != address(0), "Invalid contract address");
        require(bytes(contractType).length > 0, "Invalid contract type");
        
        contracts[contractType] = contractAddress;
        
        ContractInfo memory info = ContractInfo({
            contractAddress: contractAddress,
            contractType: contractType,
            version: version,
            isActive: true,
            updatedAt: block.timestamp
        });
        
        // Update contract references
        if (_compareStrings(contractType, "InvoiceToken")) {
            invoiceToken = InvoiceToken(contractAddress);
        } else if (_compareStrings(contractType, "Marketplace")) {
            marketplace = Marketplace(contractAddress);
        } else if (_compareStrings(contractType, "CreditScoring")) {
            creditScoring = CreditScoring(contractAddress);
        } else if (_compareStrings(contractType, "PaymentTracker")) {
            paymentTracker = PaymentTracker(contractAddress);
        } else if (_compareStrings(contractType, "UnifiedLedger")) {
            unifiedLedger = UnifiedLedger(contractAddress);
        } else if (_compareStrings(contractType, "RiskAssessment")) {
            riskAssessment = RiskAssessment(contractAddress);
        } else if (_compareStrings(contractType, "LiquidityPool")) {
            liquidityPool = LiquidityPool(contractAddress);
        }
        
        emit ContractRegistered(contractType, contractAddress, version);
        
        return true;
    }
    
    /**
     * @dev Register user in the Finternet ecosystem
     * @param userAddress The user address
     * @param role The user role
     * @param isVerified Whether the user is verified
     * @return success Whether the registration was successful
     */
    function registerUser(
        address userAddress,
        string calldata role,
        bool isVerified
    ) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(userAddress != address(0), "Invalid user address");
        
        UserInfo storage user = users[userAddress];
        
        // Check if user exists
        bool isNewUser = user.userAddress == address(0);
        
        user.userAddress = userAddress;
        user.role = role;
        user.isVerified = isVerified;
        user.isActive = true;
        
        if (isNewUser) {
            user.registeredAt = block.timestamp;
        }
        
        user.lastActiveAt = block.timestamp;
        
        if (isNewUser) {
            emit UserRegistered(userAddress, role, isVerified);
        } else {
            emit UserUpdated(userAddress, role, true);
        }
        
        return true;
    }
    
    /**
     * @dev Update fee configuration
     * @param feeType The fee type
     * @param feeAmount The fee amount
     * @param isPercentage Whether the fee is a percentage
     * @param recipient The fee recipient
     * @return success Whether the update was successful
     */
    function updateFeeConfig(
        string calldata feeType,
        uint256 feeAmount,
        bool isPercentage,
        address recipient
    ) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(bytes(feeType).length > 0, "Invalid fee type");
        require(recipient != address(0), "Invalid recipient");
        
        if (isPercentage) {
            require(feeAmount <= 1000, "Fee too high"); // Max 10%
        }
        
        _setupFee(feeType, feeAmount, isPercentage, recipient);
        
        return true;
    }
    
    /**
     * @dev Process invoice through the Finternet ecosystem
     * @param ipfsHash The IPFS hash of the invoice
     * @param totalValue The total value of the invoice
     * @param dueDate The due date of the invoice
     * @param debtor The debtor address
     * @param industry The industry of the invoice
     * @return invoiceId The invoice ID
     */
    function processInvoice(
        string calldata ipfsHash,
        uint256 totalValue,
        uint256 dueDate,
        address debtor,
        string calldata industry
    ) external nonReentrant returns (uint256 invoiceId) {
        require(address(invoiceToken) != address(0), "InvoiceToken not registered");
        require(totalValue > 0, "Invalid total value");
        require(dueDate > block.timestamp, "Invalid due date");
        
        // Check if user is registered
        UserInfo memory user = users[msg.sender];
        require(user.isActive, "User not active");
        require(_compareStrings(user.role, "issuer"), "User not an issuer");
        
        // Calculate issuance fee
        FeeConfig memory issuanceFee = fees["issuance"];
        uint256 feeAmount = 0;
        
        if (issuanceFee.isPercentage) {
            feeAmount = (totalValue * issuanceFee.feeAmount) / 10000;
        } else {
            feeAmount = issuanceFee.feeAmount;
        }
        
        // Transfer fee
        if (feeAmount > 0) {
            IERC20(stablecoin).safeTransferFrom(msg.sender, issuanceFee.recipient, feeAmount);
        }
        
        // Create invoice
        invoiceId = invoiceToken.mintInvoice(
            msg.sender,
            totalValue,
            ipfsHash,
            dueDate,
            block.timestamp + 180 days // 6 months maturity
        );
        
        // Set debtor and industry
        invoiceToken.setInvoiceDebtor(invoiceId, debtor);
        invoiceToken.setInvoiceIndustry(invoiceId, industry);
        
        // Update user activity
        users[msg.sender].lastActiveAt = block.timestamp;
        
        emit InvoiceProcessed(invoiceId, msg.sender, "created");
        
        return invoiceId;
    }
    
    /**
     * @dev Verify invoice through the Finternet ecosystem
     * @param invoiceId The invoice ID
     * @return success Whether the verification was successful
     */
    function verifyInvoice(uint256 invoiceId) external nonReentrant returns (bool success) {
        require(address(invoiceToken) != address(0), "InvoiceToken not registered");
        
        // Check if user is registered
        UserInfo memory user = users[msg.sender];
        require(user.isActive, "User not active");
        require(_compareStrings(user.role, "verifier"), "User not a verifier");
        
        // Get invoice details
        (address issuer, uint256 totalValue, bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(!isVerified, "Invoice already verified");
        
        // Calculate verification fee
        FeeConfig memory verificationFee = fees["verification"];
        uint256 feeAmount = 0;
        
        if (verificationFee.isPercentage) {
            feeAmount = (totalValue * verificationFee.feeAmount) / 10000;
        } else {
            feeAmount = verificationFee.feeAmount;
        }
        
        // Transfer fee
        if (feeAmount > 0) {
            IERC20(stablecoin).safeTransferFrom(issuer, verificationFee.recipient, feeAmount);
        }
        
        // Verify invoice
        invoiceToken.verifyInvoice(invoiceId);
        
        // Update user activity
        users[msg.sender].lastActiveAt = block.timestamp;
        
        emit InvoiceProcessed(invoiceId, issuer, "verified");
        
        return true;
    }
    
    /**
     * @dev Finance invoice through the Finternet ecosystem
     * @param invoiceId The invoice ID
     * @param amount The amount to finance
     * @return success Whether the financing was successful
     */
    function financeInvoice(uint256 invoiceId, uint256 amount) external nonReentrant returns (bool success) {
        require(address(invoiceToken) != address(0), "InvoiceToken not registered");
        require(address(liquidityPool) != address(0), "LiquidityPool not registered");
        
        // Check if user is registered
        UserInfo memory user = users[msg.sender];
        require(user.isActive, "User not active");
        require(_compareStrings(user.role, "investor") || hasRole(MANAGER_ROLE, msg.sender), "User not authorized");
        
        // Get invoice details
        (address issuer, uint256 totalValue, bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(isVerified, "Invoice not verified");
        require(amount <= totalValue, "Amount exceeds invoice value");
        
        // Check if invoice can be financed
        if (address(riskAssessment) != address(0)) {
            (bool canFinance, uint256 maxAmount, ) = riskAssessment.canFinanceInvoice(invoiceId, amount);
            require(canFinance, "Invoice cannot be financed");
            require(amount <= maxAmount, "Amount exceeds maximum financing amount");
        }
        
        // Calculate trading fee
        FeeConfig memory tradingFee = fees["trading"];
        uint256 feeAmount = 0;
        
        if (tradingFee.isPercentage) {
            feeAmount = (amount * tradingFee.feeAmount) / 10000;
        } else {
            feeAmount = tradingFee.feeAmount;
        }
        
        // Transfer fee
        if (feeAmount > 0) {
            IERC20(stablecoin).safeTransferFrom(msg.sender, tradingFee.recipient, feeAmount);
        }
        
        // Finance invoice through liquidity pool
        if (hasRole(MANAGER_ROLE, msg.sender)) {
            // If called by manager, use liquidity pool
            liquidityPool.financeInvoice(invoiceId, amount);
        } else {
            // If called by investor, purchase shares directly
            IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);
            IERC20(stablecoin).safeApprove(address(invoiceToken), amount);
            invoiceToken.purchaseInvoiceShares(invoiceId, amount);
        }
        
        // Update user activity
        users[msg.sender].lastActiveAt = block.timestamp;
        
        emit InvoiceProcessed(invoiceId, issuer, "financed");
        
        return true;
    }
    
    /**
     * @dev Set up payment tracking for an invoice
     * @param invoiceId The invoice ID
     * @param expectedAmount The expected payment amount
     * @param dueDate The due date for the payment
     * @param gracePeriod The grace period in days
     * @return success Whether the setup was successful
     */
    function setupPaymentTracking(
        uint256 invoiceId,
        uint256 expectedAmount,
        uint256 dueDate,
        uint256 gracePeriod
    ) external onlyRole(OPERATOR_ROLE) returns (bool success) {
        require(address(paymentTracker) != address(0), "PaymentTracker not registered");
        
        // Get invoice details
        (address issuer, uint256 totalValue, bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(isVerified, "Invoice not verified");
        
        // Get debtor
        address debtor = invoiceToken.getInvoiceDebtor(invoiceId);
        
        // Set up payment tracking
        paymentTracker.createPaymentSchedule(
            invoiceId,
            expectedAmount,
            dueDate,
            gracePeriod,
            debtor
        );
        
        emit InvoiceProcessed(invoiceId, issuer, "payment-tracking-setup");
        
        return true;
    }
    
    /**
     * @dev Record payment for an invoice
     * @param invoiceId The invoice ID
     * @param amount The payment amount
     * @param paymentMethod The payment method (0: Crypto, 1: BankTransfer, 2: ACH, etc.)
     * @param externalRef External reference for the payment
     * @return paymentId The payment ID
     */
    function recordPayment(
        uint256 invoiceId,
        uint256 amount,
        uint8 paymentMethod,
        string calldata externalRef
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 paymentId) {
        require(address(paymentTracker) != address(0), "PaymentTracker not registered");
        
        // Record payment
        paymentId = paymentTracker.recordPayment(
            invoiceId,
            amount,
            msg.sender,
            PaymentTracker.PaymentMethod(paymentMethod),
            externalRef
        );
        
        // Get invoice details
        (address issuer, , ) = invoiceToken.getInvoiceDetails(invoiceId);
        
        emit InvoiceProcessed(invoiceId, issuer, "payment-recorded");
        
        return paymentId;
    }
    
    /**
     * @dev Transfer invoice to another chain
     * @param invoiceId The invoice ID
     * @param destinationChain The destination chain ID
     * @return transferId The transfer ID
     */
    function transferInvoiceToChain(
        uint256 invoiceId,
        uint8 destinationChain
    ) external payable nonReentrant returns (uint256 transferId) {
        require(address(unifiedLedger) != address(0), "UnifiedLedger not registered");
        
        // Get invoice details
        (address issuer, , bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(issuer == msg.sender, "Not invoice owner");
        require(isVerified, "Invoice not verified");
        
        // Transfer invoice to another chain
        transferId = unifiedLedger.transferInvoice{value: msg.value}(
            UnifiedLedger.ChainId(destinationChain),
            invoiceId
        );
        
        emit CrossChainOperationInitiated("invoice-transfer", msg.sender, transferId);
        
        return transferId;
    }
    
    /**
     * @dev Deposit into liquidity pool
     * @param amount The amount to deposit
     * @return lpTokens The number of LP tokens minted
     */
    function depositToLiquidityPool(uint256 amount) external nonReentrant returns (uint256 lpTokens) {
        require(address(liquidityPool) != address(0), "LiquidityPool not registered");
        
        // Check if user is registered
        UserInfo memory user = users[msg.sender];
        require(user.isActive, "User not active");
        
        // Transfer tokens to this contract
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);
        
        // Approve tokens for liquidity pool
        IERC20(stablecoin).safeApprove(address(liquidityPool), amount);
        
        // Deposit to liquidity pool
        lpTokens = liquidityPool.deposit(amount);
        
        // Update user activity
        users[msg.sender].lastActiveAt = block.timestamp;
        
        emit FundsTransferred(msg.sender, address(liquidityPool), amount, "deposit");
        
        return lpTokens;
    }
    
    /**
     * @dev Withdraw from liquidity pool
     * @param lpTokenAmount The amount of LP tokens to burn
     * @return withdrawnAmount The amount withdrawn
     */
    function withdrawFromLiquidityPool(uint256 lpTokenAmount) external nonReentrant returns (uint256 withdrawnAmount) {
        require(address(liquidityPool) != address(0), "LiquidityPool not registered");
        
        // Check if user is registered
        UserInfo memory user = users[msg.sender];
        require(user.isActive, "User not active");
        
        // Withdraw from liquidity pool
        withdrawnAmount = liquidityPool.withdraw(lpTokenAmount);
        
        // Update user activity
        users[msg.sender].lastActiveAt = block.timestamp;
        
        emit FundsTransferred(address(liquidityPool), msg.sender, withdrawnAmount, "withdrawal");
        
        return withdrawnAmount;
    }
    
    /**
     * @dev Assess invoice risk
     * @param invoiceId The invoice ID
     * @return assessmentId The assessment ID
     */
    function assessInvoiceRisk(uint256 invoiceId) external onlyRole(OPERATOR_ROLE) returns (uint256 assessmentId) {
        require(address(riskAssessment) != address(0), "RiskAssessment not registered");
        
        // Assess invoice risk
        assessmentId = riskAssessment.assessInvoiceRisk(invoiceId);
        
        // Get invoice details
        (address issuer, , ) = invoiceToken.getInvoiceDetails(invoiceId);
        
        emit InvoiceProcessed(invoiceId, issuer, "risk-assessed");
        
        return assessmentId;
    }
    
    /**
     * @dev Get invoice information
     * @param invoiceId The invoice ID
     * @return issuer The issuer address
     * @return totalValue The total value
     * @return isVerified Whether the invoice is verified
     * @return dueDate The due date
     * @return debtor The debtor address
     * @return industry The industry
     */
    function getInvoiceInfo(uint256 invoiceId) external view returns (
        address issuer,
        uint256 totalValue,
        bool isVerified,
        uint256 dueDate,
        address debtor,
        string memory industry
    ) {
        require(address(invoiceToken) != address(0), "InvoiceToken not registered");
        
        (issuer, totalValue, isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        dueDate = invoiceToken.getInvoiceDueDate(invoiceId);
        debtor = invoiceToken.getInvoiceDebtor(invoiceId);
        industry = invoiceToken.getInvoiceIndustry(invoiceId);
        
        return (issuer, totalValue, isVerified, dueDate, debtor, industry);
    }
    
    /**
     * @dev Get payment schedule
     * @param invoiceId The invoice ID
     * @return expectedAmount The expected amount
     * @return dueDate The due date
     * @return gracePeriod The grace period
     * @return debtor The debtor address
     * @return status The payment status
     * @return settled Whether the payment is settled
     */
    function getPaymentSchedule(uint256 invoiceId) external view returns (
        uint256 expectedAmount,
        uint256 dueDate,
        uint256 gracePeriod,
        address debtor,
        uint8 status,
        bool settled
    ) {
        require(address(paymentTracker) != address(0), "PaymentTracker not registered");
        
        (
            expectedAmount,
            dueDate,
            gracePeriod,
            debtor,
            PaymentTracker.PaymentStatus _status,
            settled
        ) = paymentTracker.getPaymentSchedule(invoiceId);
        
        status = uint8(_status);
        
        return (expectedAmount, dueDate, gracePeriod, debtor, status, settled);
    }
    
    /**
     * @dev Get risk assessment
     * @param invoiceId The invoice ID
     * @return riskScore The risk score
     * @return defaultProbability The default probability
     * @return recoveryRate The recovery rate
     * @return recommendedInterestRate The recommended interest rate
     * @return isApproved Whether the assessment is approved
     * @return riskCategory The risk category
     */
    function getRiskAssessment(uint256 invoiceId) external view returns (
        uint8 riskScore,
        uint8 defaultProbability,
        uint8 recoveryRate,
        uint16 recommendedInterestRate,
        bool isApproved,
        string memory riskCategory
    ) {
        require(address(riskAssessment) != address(0), "RiskAssessment not registered");
        
        RiskAssessment.RiskAssessment memory assessment = riskAssessment.getInvoiceRiskAssessment(invoiceId);
        
        return (
            assessment.riskScore,
            assessment.defaultProbability,
            assessment.recoveryRate,
            assessment.recommendedInterestRate,
            assessment.isApproved,
            assessment.riskCategory
        );
    }
    
    /**
     * @dev Get user status
     * @param userAddress The user address
     * @return role The user role
     * @return isVerified Whether the user is verified
     * @return isActive Whether the user is active
     * @return registeredAt When the user was registered
     * @return lastActiveAt When the user was last active
     */
    function getUserStatus(address userAddress) external view returns (
        string memory role,
        bool isVerified,
        bool isActive,
        uint256 registeredAt,
        uint256 lastActiveAt
    ) {
        UserInfo memory user = users[userAddress];
        
        return (
            user.role,
            user.isVerified,
            user.isActive,
            user.registeredAt,
            user.lastActiveAt
        );
    }
    
    /**
     * @dev Compare two strings
     */
    function _compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
    
    /**
     * @dev Receive function to receive ETH
     */
    receive() external payable {
        // Accept ETH transfers
    }
}
