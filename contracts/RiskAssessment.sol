// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./InvoiceToken.sol";
import "./CreditScoring.sol";

/**
 * @title RiskAssessment
 * @dev Advanced risk assessment and analysis for invoice financing on the Finternet
 */
contract RiskAssessment is AccessControl, ReentrancyGuard {
    using Math for uint256;

    // Roles
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant DATA_PROVIDER_ROLE =
        keccak256("DATA_PROVIDER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Risk assessment result
    struct RiskAssessment {
        uint256 assessmentId;
        uint256 invoiceId;
        address issuer;
        address debtor;
        uint256 amount;
        uint256 dueDate;
        uint8 riskScore; // 1-100 scale
        uint8 defaultProbability; // 1-100 scale
        uint8 recoveryRate; // 1-100 scale
        uint16 recommendedInterestRate; // Basis points
        bool isApproved;
        string riskCategory; // "Low", "Medium", "High", "Very High"
        uint256 timestamp;
        address assessor;
    }

    // Industry risk data
    struct IndustryRisk {
        string industry;
        uint8 baseRiskScore; // 1-100 scale
        uint8 volatility; // 1-100 scale
        uint8 growthOutlook; // 1-100 scale
        uint8 defaultRate; // 1-100 scale
        uint256 lastUpdated;
    }

    // Market condition data
    struct MarketCondition {
        uint8 economicHealth; // 1-100 scale
        uint8 interestRateTrend; // 1-100 scale
        uint8 creditAvailability; // 1-100 scale
        uint8 marketLiquidity; // 1-100 scale
        uint256 lastUpdated;
    }

    // Contract references
    InvoiceToken public invoiceToken;
    CreditScoring public creditScoring;

    // State variables
    uint256 public assessmentCount;
    uint256 public approvalThreshold = 70; // Risk score threshold for auto-approval
    uint256 public maxLoanToValueRatio = 8000; // 80% in basis points
    uint256 public baseInterestRate = 500; // 5% in basis points

    // Mappings
    mapping(uint256 => RiskAssessment) public assessments;
    mapping(uint256 => uint256) public invoiceToAssessment;
    mapping(string => IndustryRisk) public industryRisks;
    mapping(address => uint256) public issuerAssessmentCount;
    mapping(address => uint256) public debtorAssessmentCount;
    mapping(address => mapping(address => uint8)) public counterpartyRisk; // issuer -> debtor -> risk score

    // Market condition
    MarketCondition public marketCondition;

    // Events
    event RiskAssessmentCreated(
        uint256 indexed assessmentId,
        uint256 indexed invoiceId,
        uint8 riskScore
    );
    event RiskAssessmentUpdated(uint256 indexed assessmentId, uint8 riskScore);
    event IndustryRiskUpdated(string indexed industry, uint8 baseRiskScore);
    event MarketConditionUpdated(uint8 economicHealth, uint8 marketLiquidity);
    event ApprovalThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event CounterpartyRiskUpdated(
        address indexed issuer,
        address indexed debtor,
        uint8 riskScore
    );

    /**
     * @dev Constructor
     * @param _invoiceToken Address of the invoice token contract
     * @param _creditScoring Address of the credit scoring contract
     */
    constructor(address _invoiceToken, address _creditScoring) {
        require(_invoiceToken != address(0), "Invalid invoice token address");
        require(_creditScoring != address(0), "Invalid credit scoring address");

        invoiceToken = InvoiceToken(_invoiceToken);
        creditScoring = CreditScoring(_creditScoring);

        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(RISK_MANAGER_ROLE, msg.sender);
        _setupRole(DATA_PROVIDER_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);

        // Initialize market condition
        marketCondition = MarketCondition({
            economicHealth: 70,
            interestRateTrend: 50,
            creditAvailability: 65,
            marketLiquidity: 75,
            lastUpdated: block.timestamp
        });

        // Initialize industry risks for common industries
        _setupIndustryRisk("Technology", 40, 60, 80, 25);
        _setupIndustryRisk("Healthcare", 35, 40, 75, 20);
        _setupIndustryRisk("Finance", 45, 70, 65, 30);
        _setupIndustryRisk("Retail", 60, 65, 50, 40);
        _setupIndustryRisk("Manufacturing", 55, 50, 60, 35);
        _setupIndustryRisk("Energy", 50, 75, 55, 30);
        _setupIndustryRisk("Construction", 65, 60, 50, 45);
        _setupIndustryRisk("Transportation", 55, 55, 45, 40);
        _setupIndustryRisk("Agriculture", 60, 70, 40, 35);
        _setupIndustryRisk("Entertainment", 70, 80, 60, 50);
    }

    /**
     * @dev Setup industry risk data
     */
    function _setupIndustryRisk(
        string memory industry,
        uint8 baseRiskScore,
        uint8 volatility,
        uint8 growthOutlook,
        uint8 defaultRate
    ) internal {
        IndustryRisk storage risk = industryRisks[industry];
        risk.industry = industry;
        risk.baseRiskScore = baseRiskScore;
        risk.volatility = volatility;
        risk.growthOutlook = growthOutlook;
        risk.defaultRate = defaultRate;
        risk.lastUpdated = block.timestamp;

        emit IndustryRiskUpdated(industry, baseRiskScore);
    }

    /**
     * @dev Perform risk assessment for an invoice
     * @param invoiceId The invoice ID
     * @return assessmentId The assessment ID
     */
    function assessInvoiceRisk(
        uint256 invoiceId
    )
        external
        onlyRole(RISK_MANAGER_ROLE)
        nonReentrant
        returns (uint256 assessmentId)
    {
        // Get invoice details
        (address issuer, uint256 totalValue, bool isVerified) = invoiceToken
            .getInvoiceDetails(invoiceId);
        require(isVerified, "Invoice not verified");

        // Get invoice due date and debtor
        uint256 dueDate = invoiceToken.getInvoiceDueDate(invoiceId);
        address debtor = invoiceToken.getInvoiceDebtor(invoiceId);

        // Get invoice industry
        string memory industry = invoiceToken.getInvoiceIndustry(invoiceId);

        // Get credit scores
        uint256 issuerCreditScore = creditScoring.getCreditScore(issuer);
        uint256 debtorCreditScore = creditScoring.getCreditScore(debtor);

        // Perform risk assessment
        assessmentId = ++assessmentCount;

        // Calculate risk score components
        uint8 creditScoreComponent = _calculateCreditScoreComponent(
            issuerCreditScore,
            debtorCreditScore
        );
        uint8 industryComponent = _calculateIndustryComponent(industry);
        uint8 repaymentHistoryComponent = _calculateRepaymentHistoryComponent(
            issuer,
            debtor
        );
        uint8 marketComponent = _calculateMarketComponent();
        uint8 durationComponent = _calculateDurationComponent(dueDate);

        // Calculate overall risk score (lower is better)
        uint8 riskScore = _calculateOverallRiskScore(
            creditScoreComponent,
            industryComponent,
            repaymentHistoryComponent,
            marketComponent,
            durationComponent
        );

        // Calculate default probability and recovery rate
        uint8 defaultProbability = _calculateDefaultProbability(
            riskScore,
            industry
        );
        uint8 recoveryRate = _calculateRecoveryRate(riskScore, industry);

        // Calculate recommended interest rate
        uint16 recommendedInterestRate = _calculateRecommendedInterestRate(
            riskScore,
            defaultProbability
        );

        // Determine risk category
        string memory riskCategory;
        if (riskScore <= 25) {
            riskCategory = "Low";
        } else if (riskScore <= 50) {
            riskCategory = "Medium";
        } else if (riskScore <= 75) {
            riskCategory = "High";
        } else {
            riskCategory = "Very High";
        }

        // Auto-approve if risk score is below threshold
        bool isApproved = riskScore <= approvalThreshold;

        // Create risk assessment record
        RiskAssessment memory assessment = RiskAssessment({
            assessmentId: assessmentId,
            invoiceId: invoiceId,
            issuer: issuer,
            debtor: debtor,
            amount: totalValue,
            dueDate: dueDate,
            riskScore: riskScore,
            defaultProbability: defaultProbability,
            recoveryRate: recoveryRate,
            recommendedInterestRate: recommendedInterestRate,
            isApproved: isApproved,
            riskCategory: riskCategory,
            timestamp: block.timestamp,
            assessor: msg.sender
        });

        // Store assessment
        assessments[assessmentId] = assessment;
        invoiceToAssessment[invoiceId] = assessmentId;

        // Update counters
        issuerAssessmentCount[issuer]++;
        debtorAssessmentCount[debtor]++;

        // Update counterparty risk
        _updateCounterpartyRisk(issuer, debtor, riskScore);

        emit RiskAssessmentCreated(assessmentId, invoiceId, riskScore);

        return assessmentId;
    }

    /**
     * @dev Update an existing risk assessment
     * @param assessmentId The assessment ID
     * @param riskScore The new risk score
     * @param defaultProbability The new default probability
     * @param recoveryRate The new recovery rate
     * @param recommendedInterestRate The new recommended interest rate
     * @param isApproved Whether the assessment is approved
     * @return success Whether the update was successful
     */
    function updateRiskAssessment(
        uint256 assessmentId,
        uint8 riskScore,
        uint8 defaultProbability,
        uint8 recoveryRate,
        uint16 recommendedInterestRate,
        bool isApproved
    ) external onlyRole(RISK_MANAGER_ROLE) returns (bool success) {
        require(
            assessmentId > 0 && assessmentId <= assessmentCount,
            "Invalid assessment ID"
        );

        RiskAssessment storage assessment = assessments[assessmentId];

        // Determine risk category
        string memory riskCategory;
        if (riskScore <= 25) {
            riskCategory = "Low";
        } else if (riskScore <= 50) {
            riskCategory = "Medium";
        } else if (riskScore <= 75) {
            riskCategory = "High";
        } else {
            riskCategory = "Very High";
        }

        // Update assessment
        assessment.riskScore = riskScore;
        assessment.defaultProbability = defaultProbability;
        assessment.recoveryRate = recoveryRate;
        assessment.recommendedInterestRate = recommendedInterestRate;
        assessment.isApproved = isApproved;
        assessment.riskCategory = riskCategory;
        assessment.timestamp = block.timestamp;
        assessment.assessor = msg.sender;

        // Update counterparty risk
        _updateCounterpartyRisk(
            assessment.issuer,
            assessment.debtor,
            riskScore
        );

        emit RiskAssessmentUpdated(assessmentId, riskScore);

        return true;
    }

    /**
     * @dev Update industry risk data
     * @param industry The industry name
     * @param baseRiskScore The base risk score
     * @param volatility The volatility score
     * @param growthOutlook The growth outlook score
     * @param defaultRate The default rate
     * @return success Whether the update was successful
     */
    function updateIndustryRisk(
        string calldata industry,
        uint8 baseRiskScore,
        uint8 volatility,
        uint8 growthOutlook,
        uint8 defaultRate
    ) external onlyRole(DATA_PROVIDER_ROLE) returns (bool success) {
        require(bytes(industry).length > 0, "Invalid industry");
        require(baseRiskScore <= 100, "Invalid risk score");
        require(volatility <= 100, "Invalid volatility");
        require(growthOutlook <= 100, "Invalid growth outlook");
        require(defaultRate <= 100, "Invalid default rate");

        IndustryRisk storage risk = industryRisks[industry];
        risk.industry = industry;
        risk.baseRiskScore = baseRiskScore;
        risk.volatility = volatility;
        risk.growthOutlook = growthOutlook;
        risk.defaultRate = defaultRate;
        risk.lastUpdated = block.timestamp;

        emit IndustryRiskUpdated(industry, baseRiskScore);

        return true;
    }

    /**
     * @dev Update market condition
     * @param economicHealth The economic health score
     * @param interestRateTrend The interest rate trend score
     * @param creditAvailability The credit availability score
     * @param marketLiquidity The market liquidity score
     * @return success Whether the update was successful
     */
    function updateMarketCondition(
        uint8 economicHealth,
        uint8 interestRateTrend,
        uint8 creditAvailability,
        uint8 marketLiquidity
    ) external onlyRole(DATA_PROVIDER_ROLE) returns (bool success) {
        require(economicHealth <= 100, "Invalid economic health");
        require(interestRateTrend <= 100, "Invalid interest rate trend");
        require(creditAvailability <= 100, "Invalid credit availability");
        require(marketLiquidity <= 100, "Invalid market liquidity");

        marketCondition.economicHealth = economicHealth;
        marketCondition.interestRateTrend = interestRateTrend;
        marketCondition.creditAvailability = creditAvailability;
        marketCondition.marketLiquidity = marketLiquidity;
        marketCondition.lastUpdated = block.timestamp;

        emit MarketConditionUpdated(economicHealth, marketLiquidity);

        return true;
    }

    /**
     * @dev Update counterparty risk directly
     * @param issuer The issuer address
     * @param debtor The debtor address
     * @param riskScore The risk score
     * @return success Whether the update was successful
     */
    function updateCounterpartyRisk(
        address issuer,
        address debtor,
        uint8 riskScore
    ) external onlyRole(RISK_MANAGER_ROLE) returns (bool success) {
        require(issuer != address(0), "Invalid issuer");
        require(debtor != address(0), "Invalid debtor");
        require(riskScore <= 100, "Invalid risk score");

        _updateCounterpartyRisk(issuer, debtor, riskScore);

        return true;
    }

    /**
     * @dev Set approval threshold
     * @param newThreshold The new threshold
     * @return success Whether the update was successful
     */
    function setApprovalThreshold(
        uint256 newThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(newThreshold <= 100, "Invalid threshold");

        uint256 oldThreshold = approvalThreshold;
        approvalThreshold = newThreshold;

        emit ApprovalThresholdUpdated(oldThreshold, newThreshold);

        return true;
    }

    /**
     * @dev Set max loan to value ratio
     * @param newRatio The new ratio in basis points
     * @return success Whether the update was successful
     */
    function setMaxLoanToValueRatio(
        uint256 newRatio
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(newRatio <= 10000, "Invalid ratio");

        maxLoanToValueRatio = newRatio;

        return true;
    }

    /**
     * @dev Set base interest rate
     * @param newRate The new rate in basis points
     * @return success Whether the update was successful
     */
    function setBaseInterestRate(
        uint256 newRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool success) {
        require(newRate <= 3000, "Invalid rate"); // Max 30%

        baseInterestRate = newRate;

        return true;
    }

    /**
     * @dev Get invoice risk assessment
     * @param invoiceId The invoice ID
     * @return assessment The risk assessment
     */
    function getInvoiceRiskAssessment(
        uint256 invoiceId
    ) external view returns (RiskAssessment memory) {
        uint256 assessmentId = invoiceToAssessment[invoiceId];
        require(assessmentId > 0, "No assessment found");

        return assessments[assessmentId];
    }

    /**
     * @dev Check if invoice can be financed
     * @param invoiceId The invoice ID
     * @param amount The financing amount
     * @return canFinance Whether the invoice can be financed
     * @return maxAmount The maximum financing amount
     * @return interestRate The recommended interest rate
     */
    function canFinanceInvoice(
        uint256 invoiceId,
        uint256 amount
    )
        external
        view
        returns (bool canFinance, uint256 maxAmount, uint256 interestRate)
    {
        uint256 assessmentId = invoiceToAssessment[invoiceId];
        require(assessmentId > 0, "No assessment found");

        RiskAssessment memory assessment = assessments[assessmentId];

        // Check if assessment is approved
        canFinance = assessment.isApproved;

        // Calculate max financing amount based on LTV ratio
        maxAmount = (assessment.amount * maxLoanToValueRatio) / 10000;

        // Get recommended interest rate
        interestRate = assessment.recommendedInterestRate;

        // Check if requested amount is within limits
        if (amount > maxAmount) {
            canFinance = false;
        }

        return (canFinance, maxAmount, interestRate);
    }

    /**
     * @dev Get industry risk data
     * @param industry The industry name
     * @return risk The industry risk data
     */
    function getIndustryRisk(
        string calldata industry
    ) external view returns (IndustryRisk memory) {
        return industryRisks[industry];
    }

    /**
     * @dev Get counterparty risk
     * @param issuer The issuer address
     * @param debtor The debtor address
     * @return riskScore The risk score
     */
    function getCounterpartyRisk(
        address issuer,
        address debtor
    ) external view returns (uint8) {
        return counterpartyRisk[issuer][debtor];
    }

    /**
     * @dev Calculate maximum financing amount for an invoice
     * @param invoiceId The invoice ID
     * @return maxAmount The maximum financing amount
     */
    function calculateMaxFinancingAmount(
        uint256 invoiceId
    ) external view returns (uint256 maxAmount) {
        uint256 assessmentId = invoiceToAssessment[invoiceId];
        require(assessmentId > 0, "No assessment found");

        RiskAssessment memory assessment = assessments[assessmentId];

        // Calculate max financing amount based on LTV ratio and risk score
        uint256 adjustedLTV = maxLoanToValueRatio;

        // Adjust LTV based on risk score
        if (assessment.riskScore > 75) {
            adjustedLTV = (maxLoanToValueRatio * 70) / 100; // 70% of max LTV
        } else if (assessment.riskScore > 50) {
            adjustedLTV = (maxLoanToValueRatio * 85) / 100; // 85% of max LTV
        }

        maxAmount = (assessment.amount * adjustedLTV) / 10000;

        return maxAmount;
    }

    /**
     * @dev Internal function to calculate credit score component
     */
    function _calculateCreditScoreComponent(
        uint256 issuerScore,
        uint256 debtorScore
    ) internal pure returns (uint8) {
        // Convert credit scores to risk components (lower score = higher risk)
        uint8 issuerRisk = uint8(100 - ((issuerScore * 100) / 850));
        uint8 debtorRisk = uint8(100 - ((debtorScore * 100) / 850));

        // Weight: 60% debtor, 40% issuer
        return
            uint8(
                ((uint256(debtorRisk) * 60) + (uint256(issuerRisk) * 40)) / 100
            );
    }

    /**
     * @dev Internal function to calculate industry component
     */
    function _calculateIndustryComponent(
        string memory industry
    ) internal view returns (uint8) {
        IndustryRisk memory risk = industryRisks[industry];

        // If industry not found, use average risk (50)
        if (bytes(risk.industry).length == 0) {
            return 50;
        }

        // Calculate weighted industry risk
        uint256 baseWeight = 60;
        uint256 volatilityWeight = 20;
        uint256 growthWeight = 20;

        uint256 weightedRisk = ((uint256(risk.baseRiskScore) * baseWeight) +
            (uint256(risk.volatility) * volatilityWeight) +
            (uint256(100 - risk.growthOutlook) * growthWeight)) / 100;

        return uint8(weightedRisk);
    }

    /**
     * @dev Internal function to calculate repayment history component
     */
    function _calculateRepaymentHistoryComponent(
        address issuer,
        address debtor
    ) internal view returns (uint8) {
        // Get existing counterparty risk if available
        uint8 existingRisk = counterpartyRisk[issuer][debtor];

        if (existingRisk > 0) {
            return existingRisk;
        }

        // If no history, calculate based on assessment counts
        uint256 issuerCount = issuerAssessmentCount[issuer];
        uint256 debtorCount = debtorAssessmentCount[debtor];

        // New counterparties have higher risk
        if (issuerCount == 0 && debtorCount == 0) {
            return 75; // High risk for new counterparties
        } else if (issuerCount == 0 || debtorCount == 0) {
            return 60; // Medium-high risk if one party is new
        } else {
            return 50; // Medium risk for existing counterparties without specific history
        }
    }

    /**
     * @dev Internal function to calculate market component
     */
    function _calculateMarketComponent() internal view returns (uint8) {
        // Calculate weighted market risk
        uint256 healthWeight = 40;
        uint256 interestWeight = 20;
        uint256 creditWeight = 20;
        uint256 liquidityWeight = 20;

        uint256 weightedRisk = ((uint256(100 - marketCondition.economicHealth) *
            healthWeight) +
            (uint256(marketCondition.interestRateTrend) * interestWeight) +
            (uint256(100 - marketCondition.creditAvailability) * creditWeight) +
            (uint256(100 - marketCondition.marketLiquidity) *
                liquidityWeight)) / 100;

        return uint8(weightedRisk);
    }

    /**
     * @dev Internal function to calculate duration component
     */
    function _calculateDurationComponent(
        uint256 dueDate
    ) internal view returns (uint8) {
        uint256 duration = (dueDate - block.timestamp) / 1 days;

        // Longer duration = higher risk
        if (duration <= 30) {
            return 20; // Low risk
        } else if (duration <= 60) {
            return 40; // Low-medium risk
        } else if (duration <= 90) {
            return 60; // Medium risk
        } else if (duration <= 180) {
            return 80; // Medium-high risk
        } else {
            return 100; // High risk
        }
    }

    /**
     * @dev Internal function to calculate overall risk score
     */
    function _calculateOverallRiskScore(
        uint8 creditScoreComponent,
        uint8 industryComponent,
        uint8 repaymentHistoryComponent,
        uint8 marketComponent,
        uint8 durationComponent
    ) internal pure returns (uint8) {
        // Weight components
        uint256 creditWeight = 40;
        uint256 industryWeight = 20;
        uint256 repaymentWeight = 20;
        uint256 marketWeight = 10;
        uint256 durationWeight = 10;

        uint256 weightedScore = ((uint256(creditScoreComponent) *
            creditWeight) +
            (uint256(industryComponent) * industryWeight) +
            (uint256(repaymentHistoryComponent) * repaymentWeight) +
            (uint256(marketComponent) * marketWeight) +
            (uint256(durationComponent) * durationWeight)) / 100;

        return uint8(weightedScore);
    }

    /**
     * @dev Internal function to calculate default probability
     */
    function _calculateDefaultProbability(
        uint8 riskScore,
        string memory industry
    ) internal view returns (uint8) {
        IndustryRisk memory risk = industryRisks[industry];

        // Base default probability from risk score
        uint256 baseDefaultProb = uint256(riskScore);

        // Adjust based on industry default rate
        uint256 industryFactor = risk.defaultRate > 0
            ? uint256(risk.defaultRate)
            : 35;

        uint256 adjustedDefaultProb = (baseDefaultProb *
            70 +
            industryFactor *
            30) / 100;

        // Ensure within bounds
        if (adjustedDefaultProb > 100) {
            adjustedDefaultProb = 100;
        }

        return uint8(adjustedDefaultProb);
    }

    /**
     * @dev Internal function to calculate recovery rate
     */
    function _calculateRecoveryRate(
        uint8 riskScore,
        string memory industry
    ) internal view returns (uint8) {
        // Higher risk score = lower recovery rate
        uint256 baseRecoveryRate = 100 - uint256(riskScore);

        // Adjust based on industry
        IndustryRisk memory risk = industryRisks[industry];
        uint256 industryFactor = 50; // Default

        if (bytes(risk.industry).length > 0) {
            // Higher growth outlook = higher recovery rate
            industryFactor = uint256(risk.growthOutlook);
        }

        uint256 adjustedRecoveryRate = (baseRecoveryRate *
            60 +
            industryFactor *
            40) / 100;

        // Ensure within bounds
        if (adjustedRecoveryRate > 100) {
            adjustedRecoveryRate = 100;
        }

        return uint8(adjustedRecoveryRate);
    }

    /**
     * @dev Internal function to calculate recommended interest rate
     */
    function _calculateRecommendedInterestRate(
        uint8 riskScore,
        uint8 defaultProbability
    ) internal view returns (uint16) {
        // Start with base interest rate
        uint256 rate = baseInterestRate;

        // Add risk premium based on risk score and default probability
        uint256 riskPremium = ((uint256(riskScore) * 30) +
            (uint256(defaultProbability) * 20)) / 10;

        uint256 totalRate = rate + riskPremium;

        // Ensure within reasonable bounds (max 50%)
        if (totalRate > 5000) {
            totalRate = 5000;
        }

        return uint16(totalRate);
    }

    /**
     * @dev Internal function to update counterparty risk
     */
    function _updateCounterpartyRisk(
        address issuer,
        address debtor,
        uint8 riskScore
    ) internal {
        counterpartyRisk[issuer][debtor] = riskScore;

        emit CounterpartyRiskUpdated(issuer, debtor, riskScore);
    }
}
