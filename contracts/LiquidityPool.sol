// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./InvoiceToken.sol";
import "./CreditScoring.sol";

/**
 * @title LiquidityPool
 * @dev Manages liquidity for invoice financing on the Finternet
 */
contract LiquidityPool is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");
    
    // Pool state
    struct PoolInfo {
        uint256 totalSupply;         // Total LP tokens issued
        uint256 totalAssets;         // Total assets managed by the pool
        uint256 totalInvoicesBacked; // Total number of invoices backed
        uint256 totalValueFinanced;  // Total value of invoices financed
        uint256 totalValueRepaid;    // Total value repaid
        uint256 apy;                 // Current APY in basis points
        uint256 utilizationRate;     // Current utilization rate in basis points
        uint256 lastUpdateTimestamp; // Last time pool stats were updated
    }
    
    // User position
    struct UserPosition {
        uint256 lpTokens;            // LP tokens held
        uint256 pendingRewards;      // Pending rewards
        uint256 lastClaimTimestamp;  // Last time rewards were claimed
    }
    
    // Investment strategy
    struct Strategy {
        string name;
        uint256 targetRiskLevel;     // 1-10 scale
        uint256 minCreditScore;      // Minimum credit score for invoices
        uint256 maxInterestRate;     // Maximum interest rate in basis points
        uint256 maxDuration;         // Maximum invoice duration in days
        uint256 allocationPercentage; // Percentage of pool to allocate to strategy
        bool isActive;
    }
    
    // Asset configuration
    struct AssetConfig {
        address tokenAddress;
        bool isSupported;
        uint256 weight;              // Weight in the pool
        uint256 minDeposit;          // Minimum deposit amount
        uint256 maxDeposit;          // Maximum deposit amount (0 = no limit)
    }
    
    // State variables
    address public immutable stablecoin;         // USDC or DAI address
    InvoiceToken public immutable invoiceToken;  // Invoice token contract
    CreditScoring public immutable creditScoring; // Credit scoring contract
    
    // Pool data
    PoolInfo public poolInfo;
    mapping(address => UserPosition) public userPositions;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => AssetConfig) public supportedAssets;
    mapping(uint256 => uint256) public invoiceToStrategy;  // Maps invoice IDs to strategy IDs
    
    // Fee structure
    uint256 public depositFee = 50;       // 0.5% in basis points
    uint256 public withdrawalFee = 100;   // 1% in basis points
    uint256 public performanceFee = 1000; // 10% in basis points
    address public feeRecipient;
    
    // Limits
    uint256 public maxPoolSize = 10_000_000 * 10**6; // 10M USDC (assuming 6 decimals)
    uint256 public minLockPeriod = 7 days;
    uint256 public earlyWithdrawalFee = 300; // 3% in basis points
    
    // Strategy tracking
    uint256 public strategyCount;
    
    // Events
    event Deposit(address indexed user, address token, uint256 amount, uint256 lpTokens);
    event Withdrawal(address indexed user, address token, uint256 amount, uint256 lpTokens);
    event RewardClaimed(address indexed user, uint256 amount);
    event InvoiceFinanced(uint256 indexed invoiceId, uint256 amount, uint256 strategyId);
    event RepaymentReceived(uint256 indexed invoiceId, uint256 amount);
    event StrategyAdded(uint256 indexed strategyId, string name);
    event StrategyUpdated(uint256 indexed strategyId, string name);
    event AssetConfigUpdated(address indexed token, bool isSupported);
    event APYUpdated(uint256 newApy);
    
    /**
     * @dev Constructor
     * @param _stablecoin Stablecoin address (USDC, DAI, etc.)
     * @param _invoiceToken Invoice token contract address
     * @param _creditScoring Credit scoring contract address
     * @param _feeRecipient Fee recipient address
     */
    constructor(
        address _stablecoin,
        address _invoiceToken,
        address _creditScoring,
        address _feeRecipient
    ) {
        require(_stablecoin != address(0), "Invalid stablecoin address");
        require(_invoiceToken != address(0), "Invalid invoice token address");
        require(_creditScoring != address(0), "Invalid credit scoring address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        
        stablecoin = _stablecoin;
        invoiceToken = InvoiceToken(_invoiceToken);
        creditScoring = CreditScoring(_creditScoring);
        feeRecipient = _feeRecipient;
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANAGER_ROLE, msg.sender);
        _setupRole(STRATEGY_ROLE, msg.sender);
        
        // Initialize pool info
        poolInfo = PoolInfo({
            totalSupply: 0,
            totalAssets: 0,
            totalInvoicesBacked: 0,
            totalValueFinanced: 0,
            totalValueRepaid: 0,
            apy: 0,
            utilizationRate: 0,
            lastUpdateTimestamp: block.timestamp
        });
        
        // Add default stablecoin as supported asset
        AssetConfig memory defaultConfig = AssetConfig({
            tokenAddress: _stablecoin,
            isSupported: true,
            weight: 10000, // 100% weight
            minDeposit: 100 * 10**6, // 100 USDC (assuming 6 decimals)
            maxDeposit: 0 // No limit
        });
        
        supportedAssets[_stablecoin] = defaultConfig;
        
        // Add default conservative strategy
        _addStrategy(
            "Conservative",
            3, // Low risk level
            700, // High credit score requirement
            800, // 8% max interest rate
            60, // 60 days max duration
            7000, // 70% allocation
            true
        );
        
        // Add default balanced strategy
        _addStrategy(
            "Balanced",
            5, // Medium risk level
            600, // Medium credit score requirement
            1200, // 12% max interest rate
            90, // 90 days max duration
            2000, // 20% allocation
            true
        );
        
        // Add default aggressive strategy
        _addStrategy(
            "Aggressive",
            8, // High risk level
            500, // Lower credit score requirement
            2000, // 20% max interest rate
            120, // 120 days max duration
            1000, // 10% allocation
            true
        );
    }
    
    /**
     * @dev Deposit stablecoins into the pool
     * @param amount The amount to deposit
     * @return lpTokens The number of LP tokens minted
     */
    function deposit(uint256 amount) external nonReentrant returns (uint256 lpTokens) {
        require(amount > 0, "Amount must be greater than 0");
        
        AssetConfig memory config = supportedAssets[stablecoin];
        require(config.isSupported, "Asset not supported");
        require(amount >= config.minDeposit, "Amount below minimum deposit");
        require(config.maxDeposit == 0 || amount <= config.maxDeposit, "Amount above maximum deposit");
        require(poolInfo.totalAssets + amount <= maxPoolSize, "Pool size limit reached");
        
        // Calculate fee
        uint256 fee = (amount * depositFee) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        // Transfer tokens to this contract
        IERC20(stablecoin).safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
        }
        
        // Calculate LP tokens to mint
        lpTokens = _calculateLPTokensToMint(amountAfterFee);
        
        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        position.lpTokens += lpTokens;
        position.lastClaimTimestamp = block.timestamp;
        
        // Update pool info
        poolInfo.totalSupply += lpTokens;
        poolInfo.totalAssets += amountAfterFee;
        poolInfo.lastUpdateTimestamp = block.timestamp;
        
        // Update utilization rate
        _updateUtilizationRate();
        
        emit Deposit(msg.sender, stablecoin, amount, lpTokens);
        
        return lpTokens;
    }
    
    /**
     * @dev Withdraw stablecoins from the pool
     * @param lpTokenAmount The amount of LP tokens to burn
     * @return withdrawnAmount The amount withdrawn
     */
    function withdraw(uint256 lpTokenAmount) external nonReentrant returns (uint256 withdrawnAmount) {
        require(lpTokenAmount > 0, "Amount must be greater than 0");
        
        UserPosition storage position = userPositions[msg.sender];
        require(position.lpTokens >= lpTokenAmount, "Insufficient LP tokens");
        
        // Check lock period
        bool earlyWithdrawal = (block.timestamp - position.lastClaimTimestamp) < minLockPeriod;
        
        // Calculate withdrawal amount
        uint256 withdrawalValue = _calculateWithdrawalAmount(lpTokenAmount);
        
        // Calculate fees
        uint256 fee = (withdrawalValue * withdrawalFee) / 10000;
        
        // Add early withdrawal fee if applicable
        if (earlyWithdrawal) {
            fee += (withdrawalValue * earlyWithdrawalFee) / 10000;
        }
        
        withdrawnAmount = withdrawalValue - fee;
        
        // Update user position
        position.lpTokens -= lpTokenAmount;
        
        // Update pool info
        poolInfo.totalSupply -= lpTokenAmount;
        poolInfo.totalAssets -= withdrawalValue;
        poolInfo.lastUpdateTimestamp = block.timestamp;
        
        // Update utilization rate
        _updateUtilizationRate();
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
        }
        
        // Transfer tokens to user
        IERC20(stablecoin).safeTransfer(msg.sender, withdrawnAmount);
        
        emit Withdrawal(msg.sender, stablecoin, withdrawnAmount, lpTokenAmount);
        
        return withdrawnAmount;
    }
    
    /**
     * @dev Claim pending rewards
     * @return rewardAmount The amount of rewards claimed
     */
    function claimRewards() external nonReentrant returns (uint256 rewardAmount) {
        UserPosition storage position = userPositions[msg.sender];
        require(position.lpTokens > 0, "No LP tokens");
        
        // Calculate pending rewards
        rewardAmount = _calculatePendingRewards(msg.sender);
        require(rewardAmount > 0, "No rewards to claim");
        
        // Apply performance fee
        uint256 fee = (rewardAmount * performanceFee) / 10000;
        uint256 rewardAfterFee = rewardAmount - fee;
        
        // Reset pending rewards
        position.pendingRewards = 0;
        position.lastClaimTimestamp = block.timestamp;
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            IERC20(stablecoin).safeTransfer(feeRecipient, fee);
        }
        
        // Transfer rewards to user
        IERC20(stablecoin).safeTransfer(msg.sender, rewardAfterFee);
        
        emit RewardClaimed(msg.sender, rewardAfterFee);
        
        return rewardAfterFee;
    }
    
    /**
     * @dev Finance an invoice
     * @param invoiceId The invoice ID
     * @param amount The amount to finance
     * @return success Whether the financing was successful
     */
    function financeInvoice(uint256 invoiceId, uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant returns (bool success) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= poolInfo.totalAssets, "Insufficient pool assets");
        
        // Get invoice details
        (address issuer, uint256 totalValue, bool isVerified) = invoiceToken.getInvoiceDetails(invoiceId);
        require(isVerified, "Invoice not verified");
        require(amount <= totalValue, "Amount exceeds invoice value");
        
        // Get invoice maturity date
        uint256 dueDate = invoiceToken.getInvoiceDueDate(invoiceId);
        require(dueDate > block.timestamp, "Invoice already due");
        
        // Get issuer credit score
        uint256 creditScore = creditScoring.getCreditScore(issuer);
        
        // Find appropriate strategy
        uint256 strategyId = _findSuitableStrategy(creditScore, dueDate, totalValue);
        require(strategyId > 0, "No suitable strategy found");
        
        // Store strategy for this invoice
        invoiceToStrategy[invoiceId] = strategyId;
        
        // Purchase invoice shares
        invoiceToken.purchaseInvoiceShares(invoiceId, amount);
        
        // Update pool info
        poolInfo.totalInvoicesBacked += 1;
        poolInfo.totalValueFinanced += amount;
        poolInfo.lastUpdateTimestamp = block.timestamp;
        
        // Update utilization rate
        _updateUtilizationRate();
        
        emit InvoiceFinanced(invoiceId, amount, strategyId);
        
        return true;
    }
    
    /**
     * @dev Record repayment for an invoice
     * @param invoiceId The invoice ID
     * @param amount The repayment amount
     * @return success Whether the recording was successful
     */
    function recordRepayment(uint256 invoiceId, uint256 amount) external onlyRole(MANAGER_ROLE) nonReentrant returns (bool success) {
        require(amount > 0, "Amount must be greater than 0");
        
        // Update pool info
        poolInfo.totalValueRepaid += amount;
        poolInfo.lastUpdateTimestamp = block.timestamp;
        
        // Update utilization rate
        _updateUtilizationRate();
        
        // Distribute rewards to LP providers
        _distributeRewards(amount);
        
        emit RepaymentReceived(invoiceId, amount);
        
        return true;
    }
    
    /**
     * @dev Add a new investment strategy
     * @param name The strategy name
     * @param targetRiskLevel The target risk level (1-10)
     * @param minCreditScore The minimum credit score
     * @param maxInterestRate The maximum interest rate in basis points
     * @param maxDuration The maximum invoice duration in days
     * @param allocationPercentage The allocation percentage in basis points
     * @param isActive Whether the strategy is active
     * @return strategyId The ID of the new strategy
     */
    function addStrategy(
        string calldata name,
        uint256 targetRiskLevel,
        uint256 minCreditScore,
        uint256 maxInterestRate,
        uint256 maxDuration,
        uint256 allocationPercentage,
        bool isActive
    ) external onlyRole(STRATEGY_ROLE) returns (uint256 strategyId) {
        return _addStrategy(
            name,
            targetRiskLevel,
            minCreditScore,
            maxInterestRate,
            maxDuration,
            allocationPercentage,
            isActive
        );
    }
    
    /**
     * @dev Update an existing strategy
     * @param strategyId The strategy ID
     * @param name The strategy name
     * @param targetRiskLevel The target risk level (1-10)
     * @param minCreditScore The minimum credit score
     * @param maxInterestRate The maximum interest rate in basis points
     * @param maxDuration The maximum invoice duration in days
     * @param allocationPercentage The allocation percentage in basis points
     * @param isActive Whether the strategy is active
     * @return success Whether the update was successful
     */
    function updateStrategy(
        uint256 strategyId,
        string calldata name,
        uint256 targetRiskLevel,
        uint256 minCreditScore,
        uint256 maxInterestRate,
        uint256 maxDuration,
        uint256 allocationPercentage,
        bool isActive
    ) external onlyRole(STRATEGY_ROLE) returns (bool success) {
        require(strategyId > 0 && strategyId <= strategyCount, "Invalid strategy ID");
        
        Strategy storage strategy = strategies[strategyId];
        
        strategy.name = name;
        strategy.targetRiskLevel = targetRiskLevel;
        strategy.minCreditScore = minCreditScore;
        strategy.maxInterestRate = maxInterestRate;
        strategy.maxDuration = maxDuration;
        strategy.allocationPercentage = allocationPercentage;
        strategy.isActive = isActive;
        
        emit StrategyUpdated(strategyId, name);
        
        return true;
    }
    
    /**
     * @dev Update supported asset configuration
     * @param token The token address
     * @param isSupported Whether the token is supported
     * @param weight The weight in the pool
     * @param minDeposit The minimum deposit amount
     * @param maxDeposit The maximum deposit amount
     * @return success Whether the update was successful
     */
    function updateAssetConfig(
        address token,
        bool isSupported,
        uint256 weight,
        uint256 minDeposit,
        uint256 maxDeposit
    ) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(token != address(0), "Invalid token address");
        
        AssetConfig storage config = supportedAssets[token];
        
        config.tokenAddress = token;
        config.isSupported = isSupported;
        config.weight = weight;
        config.minDeposit = minDeposit;
        config.maxDeposit = maxDeposit;
        
        emit AssetConfigUpdated(token, isSupported);
        
        return true;
    }
    
    /**
     * @dev Set fee configuration
     * @param _depositFee The deposit fee in basis points
     * @param _withdrawalFee The withdrawal fee in basis points
     * @param _performanceFee The performance fee in basis points
     * @param _earlyWithdrawalFee The early withdrawal fee in basis points
     * @return success Whether the update was successful
     */
    function setFeeConfig(
        uint256 _depositFee,
        uint256 _withdrawalFee,
        uint256 _performanceFee,
        uint256 _earlyWithdrawalFee
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(_depositFee <= 500, "Deposit fee too high"); // Max 5%
        require(_withdrawalFee <= 500, "Withdrawal fee too high"); // Max 5%
        require(_performanceFee <= 3000, "Performance fee too high"); // Max 30%
        require(_earlyWithdrawalFee <= 1000, "Early withdrawal fee too high"); // Max 10%
        
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
        performanceFee = _performanceFee;
        earlyWithdrawalFee = _earlyWithdrawalFee;
        
        return true;
    }
    
    /**
     * @dev Set fee recipient
     * @param _feeRecipient The fee recipient address
     * @return success Whether the update was successful
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        
        feeRecipient = _feeRecipient;
        
        return true;
    }
    
    /**
     * @dev Set minimum lock period
     * @param _minLockPeriod The minimum lock period in seconds
     * @return success Whether the update was successful
     */
    function setMinLockPeriod(uint256 _minLockPeriod) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(_minLockPeriod <= 30 days, "Lock period too long"); // Max 30 days
        
        minLockPeriod = _minLockPeriod;
        
        return true;
    }
    
    /**
     * @dev Set maximum pool size
     * @param _maxPoolSize The maximum pool size
     * @return success Whether the update was successful
     */
    function setMaxPoolSize(uint256 _maxPoolSize) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(_maxPoolSize >= poolInfo.totalAssets, "Max pool size too small");
        
        maxPoolSize = _maxPoolSize;
        
        return true;
    }
    
    /**
     * @dev Manually update APY
     * @param newApy The new APY in basis points
     * @return success Whether the update was successful
     */
    function updateAPY(uint256 newApy) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(newApy <= 5000, "APY too high"); // Max 50%
        
        poolInfo.apy = newApy;
        poolInfo.lastUpdateTimestamp = block.timestamp;
        
        emit APYUpdated(newApy);
        
        return true;
    }
    
    /**
     * @dev Get user info
     * @param user The user address
     * @return lpTokens The number of LP tokens held
     * @return pendingRewards The pending rewards
     * @return userShare The user's share of the pool
     */
    function getUserInfo(address user) external view returns (
        uint256 lpTokens,
        uint256 pendingRewards,
        uint256 userShare
    ) {
        UserPosition memory position = userPositions[user];
        
        lpTokens = position.lpTokens;
        pendingRewards = _calculatePendingRewards(user);
        
        // Calculate user share (in basis points)
        userShare = poolInfo.totalSupply > 0 
            ? (position.lpTokens * 10000) / poolInfo.totalSupply
            : 0;
        
        return (lpTokens, pendingRewards, userShare);
    }
    
    /**
     * @dev Get pool info
     * @return info The pool info
     */
    function getPoolInfo() external view returns (PoolInfo memory) {
        return poolInfo;
    }
    
    /**
     * @dev Get strategy info
     * @param strategyId The strategy ID
     * @return strategy The strategy info
     */
    function getStrategyInfo(uint256 strategyId) external view returns (Strategy memory) {
        require(strategyId > 0 && strategyId <= strategyCount, "Invalid strategy ID");
        
        return strategies[strategyId];
    }
    
    /**
     * @dev Get active strategies
     * @return activeStrategyIds The active strategy IDs
     */
    function getActiveStrategies() external view returns (uint256[] memory activeStrategyIds) {
        uint256 count = 0;
        
        // Count active strategies
        for (uint256 i = 1; i <= strategyCount; i++) {
            if (strategies[i].isActive) {
                count++;
            }
        }
        
        activeStrategyIds = new uint256[](count);
        
        // Fill array with active strategy IDs
        uint256 index = 0;
        for (uint256 i = 1; i <= strategyCount; i++) {
            if (strategies[i].isActive) {
                activeStrategyIds[index] = i;
                index++;
            }
        }
        
        return activeStrategyIds;
    }
    
    /**
     * @dev Internal function to add a strategy
     */
    function _addStrategy(
        string memory name,
        uint256 targetRiskLevel,
        uint256 minCreditScore,
        uint256 maxInterestRate,
        uint256 maxDuration,
        uint256 allocationPercentage,
        bool isActive
    ) internal returns (uint256 strategyId) {
        require(targetRiskLevel >= 1 && targetRiskLevel <= 10, "Invalid risk level");
        require(minCreditScore >= 300 && minCreditScore <= 850, "Invalid credit score");
        require(maxInterestRate <= 5000, "Interest rate too high"); // Max 50%
        require(maxDuration > 0, "Invalid duration");
        require(allocationPercentage <= 10000, "Invalid allocation percentage");
        
        strategyId = ++strategyCount;
        
        Strategy storage strategy = strategies[strategyId];
        strategy.name = name;
        strategy.targetRiskLevel = targetRiskLevel;
        strategy.minCreditScore = minCreditScore;
        strategy.maxInterestRate = maxInterestRate;
        strategy.maxDuration = maxDuration;
        strategy.allocationPercentage = allocationPercentage;
        strategy.isActive = isActive;
        
        emit StrategyAdded(strategyId, name);
        
        return strategyId;
    }
    
    /**
     * @dev Internal function to find a suitable strategy for an invoice
     */
    function _findSuitableStrategy(
        uint256 creditScore,
        uint256 dueDate,
        uint256 totalValue
    ) internal view returns (uint256) {
        uint256 bestStrategyId = 0;
        uint256 bestScore = 0;
        
        uint256 duration = (dueDate - block.timestamp) / 1 days;
        
        for (uint256 i = 1; i <= strategyCount; i++) {
            Strategy memory strategy = strategies[i];
            
            if (!strategy.isActive) {
                continue;
            }
            
            // Check if invoice meets strategy criteria
            if (creditScore < strategy.minCreditScore || duration > strategy.maxDuration) {
                continue;
            }
            
            // Calculate match score (higher is better)
            uint256 creditScoreMatch = creditScore >= strategy.minCreditScore ? 100 : 0;
            uint256 durationMatch = duration <= strategy.maxDuration ? 100 : 0;
            
            uint256 score = creditScoreMatch + durationMatch;
            
            // Choose strategy with highest score
            if (score > bestScore) {
                bestScore = score;
                bestStrategyId = i;
            }
        }
        
        return bestStrategyId;
    }
    
    /**
     * @dev Internal function to calculate LP tokens to mint
     */
    function _calculateLPTokensToMint(uint256 amount) internal view returns (uint256) {
        if (poolInfo.totalSupply == 0 || poolInfo.totalAssets == 0) {
            // Initial deposit: 1 token = 1 LP token
            return amount;
        }
        
        // Calculate based on pool share
        return (amount * poolInfo.totalSupply) / poolInfo.totalAssets;
    }
    
    /**
     * @dev Internal function to calculate withdrawal amount
     */
    function _calculateWithdrawalAmount(uint256 lpTokenAmount) internal view returns (uint256) {
        if (poolInfo.totalSupply == 0) {
            return 0;
        }
        
        // Calculate based on pool share
        return (lpTokenAmount * poolInfo.totalAssets) / poolInfo.totalSupply;
    }
    
    /**
     * @dev Internal function to calculate pending rewards
     */
    function _calculatePendingRewards(address user) internal view returns (uint256) {
        UserPosition memory position = userPositions[user];
        
        if (position.lpTokens == 0) {
            return 0;
        }
        
        // Start with already accrued rewards
        uint256 pendingRewards = position.pendingRewards;
        
        // Add newly accrued rewards based on time and APY
        uint256 timeElapsed = block.timestamp - position.lastClaimTimestamp;
        if (timeElapsed > 0) {
            uint256 userShare = (position.lpTokens * 10000) / poolInfo.totalSupply;
            uint256 userAssets = (poolInfo.totalAssets * userShare) / 10000;
            
            // Calculate rewards based on APY
            // Formula: rewards = userAssets * apy * timeElapsed / (365 days * 10000)
            uint256 newRewards = (userAssets * poolInfo.apy * timeElapsed) / (365 days * 10000);
            
            pendingRewards += newRewards;
        }
        
        return pendingRewards;
    }
    
    /**
     * @dev Internal function to update utilization rate
     */
    function _updateUtilizationRate() internal {
        if (poolInfo.totalAssets == 0) {
            poolInfo.utilizationRate = 0;
            return;
        }
        
        // Calculate utilization rate (in basis points)
        poolInfo.utilizationRate = (poolInfo.totalValueFinanced * 10000) / poolInfo.totalAssets;
        
        // Update APY based on utilization rate
        _updateAPYBasedOnUtilization();
    }
    
    /**
     * @dev Internal function to update APY based on utilization
     */
    function _updateAPYBasedOnUtilization() internal {
        // Base APY (in basis points)
        uint256 baseApy = 300; // 3%
        
        // Additional APY based on utilization
        uint256 utilizationBonus = 0;
        
        if (poolInfo.utilizationRate > 8000) {
            // High utilization (>80%)
            utilizationBonus = 700; // +7%
        } else if (poolInfo.utilizationRate > 5000) {
            // Medium utilization (>50%)
            utilizationBonus = 400; // +4%
        } else if (poolInfo.utilizationRate > 2000) {
            // Low utilization (>20%)
            utilizationBonus = 200; // +2%
        }
        
        poolInfo.apy = baseApy + utilizationBonus;
        
        emit APYUpdated(poolInfo.apy);
    }
    
    /**
     * @dev Internal function to distribute rewards
     */
    function _distributeRewards(uint256 amount) internal {
        if (poolInfo.totalSupply == 0) {
            return;
        }
        
        // Distribute rewards proportionally to LP providers
        for (uint256 i = 0; i < 1; i++) {
            // Note: In a real implementation, we would need to track all LP providers
            // For this demonstration, we just update the pool info
            poolInfo.apy = (amount * 10000 * 365) / (poolInfo.totalAssets * 30); // Approximate APY
        }
    }
    
    /**
     * @dev Receive function to receive ETH
     */
    receive() external payable {
        // Allow receiving ETH
    }
}
