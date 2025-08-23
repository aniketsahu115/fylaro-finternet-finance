// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CreditScoring
 * @dev On-chain credit scoring and risk assessment for businesses
 */
contract CreditScoring is AccessControl, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeMath for uint256;

    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Industry categories for business classification
    enum IndustryCategory {
        Technology,
        Finance,
        Healthcare,
        Retail,
        Manufacturing,
        Energy,
        RealEstate,
        Agriculture,
        Education,
        Transportation,
        Other
    }
    
    // Payment status options
    enum PaymentStatus {
        OnTime,
        Late,
        VeryLate,
        Default,
        Renegotiated
    }
    
    // Business profile structure
    struct BusinessProfile {
        uint256 profileId;
        address businessAddress;
        string businessId;
        IndustryCategory industry;
        uint8 creditScore; // 0-100 scale
        uint8 riskLevel; // 1-5 scale (1 = lowest risk, 5 = highest risk)
        uint256 totalInvoices;
        uint256 totalPaymentsOnTime;
        uint256 totalPaymentsLate;
        uint256 totalDefaults;
        uint256 averagePaymentDelay; // In days
        bool isVerified;
        uint256 lastScoreUpdate;
        uint256 recommendedRate; // Basis points (e.g. 500 = 5%)
    }
    
    // Payment record structure
    struct PaymentRecord {
        uint256 recordId;
        uint256 invoiceId;
        uint256 expectedPaymentDate;
        uint256 actualPaymentDate;
        PaymentStatus status;
        uint256 delayDays;
        uint256 recordedAt;
    }
    
    // Industry risk multipliers (100 = neutral, <100 = lower risk, >100 = higher risk)
    mapping(IndustryCategory => uint256) public industryRiskMultipliers;
    
    // Business profiles
    mapping(address => BusinessProfile) public businessProfiles;
    mapping(uint256 => address) public profileIdToAddress;
    mapping(string => address) public businessIdToAddress;
    
    // Payment history
    mapping(address => PaymentRecord[]) public paymentHistory;
    mapping(uint256 => uint256) public invoiceToLatestPayment;
    
    // Default probability models
    mapping(uint8 => uint256) public riskLevelDefaultProbability; // Basis points
    
    // Business tracking
    EnumerableSet.AddressSet private registeredBusinesses;
    uint256 public nextProfileId;
    
    // Events
    event BusinessRegistered(address indexed business, uint256 indexed profileId, IndustryCategory industry);
    event PaymentRecordAdded(address indexed business, uint256 indexed invoiceId, PaymentStatus status, uint256 delayDays);
    event CreditScoreUpdated(address indexed business, uint8 previousScore, uint8 newScore, uint8 riskLevel);
    event BusinessVerified(address indexed business, bool verified);
    event IndustryRiskMultiplierUpdated(IndustryCategory indexed industry, uint256 multiplier);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        // Initialize default industry risk multipliers
        industryRiskMultipliers[IndustryCategory.Technology] = 90; // Lower risk
        industryRiskMultipliers[IndustryCategory.Finance] = 80;
        industryRiskMultipliers[IndustryCategory.Healthcare] = 85;
        industryRiskMultipliers[IndustryCategory.Retail] = 110; // Higher risk
        industryRiskMultipliers[IndustryCategory.Manufacturing] = 100;
        industryRiskMultipliers[IndustryCategory.Energy] = 95;
        industryRiskMultipliers[IndustryCategory.RealEstate] = 105;
        industryRiskMultipliers[IndustryCategory.Agriculture] = 115;
        industryRiskMultipliers[IndustryCategory.Education] = 85;
        industryRiskMultipliers[IndustryCategory.Transportation] = 110;
        industryRiskMultipliers[IndustryCategory.Other] = 120;
        
        // Initialize default probability for each risk level (in basis points)
        riskLevelDefaultProbability[1] = 50;   // 0.5%
        riskLevelDefaultProbability[2] = 200;  // 2%
        riskLevelDefaultProbability[3] = 500;  // 5%
        riskLevelDefaultProbability[4] = 1000; // 10%
        riskLevelDefaultProbability[5] = 2000; // 20%
    }
    
    /**
     * @dev Registers a new business for credit scoring
     * @param business The address of the business
     * @param businessId External business identifier
     * @param industry The industry category of the business
     * @return profileId The ID of the created profile
     */
    function registerBusiness(
        address business,
        string calldata businessId,
        IndustryCategory industry
    ) external returns (uint256 profileId) {
        require(business != address(0), "Invalid business address");
        require(businessProfiles[business].profileId == 0, "Business already registered");
        require(businessIdToAddress[businessId] == address(0), "Business ID already exists");
        
        profileId = nextProfileId++;
        
        BusinessProfile memory profile = BusinessProfile({
            profileId: profileId,
            businessAddress: business,
            businessId: businessId,
            industry: industry,
            creditScore: 50, // Default neutral score
            riskLevel: 3, // Default medium risk
            totalInvoices: 0,
            totalPaymentsOnTime: 0,
            totalPaymentsLate: 0,
            totalDefaults: 0,
            averagePaymentDelay: 0,
            isVerified: false,
            lastScoreUpdate: block.timestamp,
            recommendedRate: calculateBaseRate(3, industry) // Calculate default rate based on medium risk
        });
        
        businessProfiles[business] = profile;
        profileIdToAddress[profileId] = business;
        businessIdToAddress[businessId] = business;
        EnumerableSet.add(registeredBusinesses, business);
        
        emit BusinessRegistered(business, profileId, industry);
        return profileId;
    }
    
    /**
     * @dev Updates a payment record for a business
     * @param business The address of the business
     * @param invoiceId The ID of the invoice
     * @param expectedDate The expected payment date
     * @param actualDate The actual payment date
     * @param status The status of the payment
     */
    function updatePaymentRecord(
        address business,
        uint256 invoiceId,
        uint256 expectedDate,
        uint256 actualDate,
        PaymentStatus status
    ) external onlyRole(UPDATER_ROLE) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        
        // Calculate delay in days
        uint256 delayDays = 0;
        if (actualDate > expectedDate) {
            delayDays = (actualDate - expectedDate) / 1 days;
        }
        
        PaymentRecord memory record = PaymentRecord({
            recordId: paymentHistory[business].length,
            invoiceId: invoiceId,
            expectedPaymentDate: expectedDate,
            actualPaymentDate: actualDate,
            status: status,
            delayDays: delayDays,
            recordedAt: block.timestamp
        });
        
        paymentHistory[business].push(record);
        invoiceToLatestPayment[invoiceId] = record.recordId;
        
        // Update business profile statistics
        BusinessProfile storage profile = businessProfiles[business];
        profile.totalInvoices += 1;
        
        if (status == PaymentStatus.OnTime) {
            profile.totalPaymentsOnTime += 1;
        } else if (status == PaymentStatus.Late || status == PaymentStatus.VeryLate) {
            profile.totalPaymentsLate += 1;
            
            // Update average payment delay
            if (profile.averagePaymentDelay == 0) {
                profile.averagePaymentDelay = delayDays;
            } else {
                profile.averagePaymentDelay = (profile.averagePaymentDelay * (profile.totalPaymentsLate - 1) + delayDays) / profile.totalPaymentsLate;
            }
        } else if (status == PaymentStatus.Default) {
            profile.totalDefaults += 1;
        }
        
        // Recalculate credit score
        calculateCreditScore(business);
        
        emit PaymentRecordAdded(business, invoiceId, status, delayDays);
    }
    
    /**
     * @dev Calculates and updates the credit score for a business
     * @param business The address of the business
     * @return newScore The newly calculated credit score
     */
    function calculateCreditScore(address business) public returns (uint8 newScore) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        
        BusinessProfile storage profile = businessProfiles[business];
        uint8 previousScore = profile.creditScore;
        
        if (profile.totalInvoices == 0) {
            return profile.creditScore; // No change if no invoices
        }
        
        // Factor weights (total 100)
        uint256 paymentHistoryWeight = 35;
        uint256 defaultRateWeight = 30;
        uint256 delayFactorWeight = 20;
        uint256 industryFactorWeight = 10;
        uint256 ageFactorWeight = 5;
        
        // Calculate payment history factor (0-100)
        uint256 paymentHistoryFactor = 0;
        if (profile.totalInvoices > 0) {
            paymentHistoryFactor = (profile.totalPaymentsOnTime * 100) / profile.totalInvoices;
        }
        
        // Calculate default rate factor (0-100)
        uint256 defaultRateFactor = 100;
        if (profile.totalInvoices > 0 && profile.totalDefaults > 0) {
            uint256 defaultRate = (profile.totalDefaults * 100) / profile.totalInvoices;
            defaultRateFactor = defaultRate <= 50 ? 100 - (defaultRate * 2) : 0;
        }
        
        // Calculate delay factor (0-100)
        uint256 delayFactor = 100;
        if (profile.averagePaymentDelay > 0) {
            // Penalize more heavily for longer delays
            if (profile.averagePaymentDelay <= 7) {
                delayFactor = 100 - (profile.averagePaymentDelay * 5); // -5 points per day up to 7 days
            } else if (profile.averagePaymentDelay <= 30) {
                delayFactor = 65 - ((profile.averagePaymentDelay - 7) * 2); // -2 points per day after 7 days
            } else {
                delayFactor = 15; // Minimum 15 points for very late payments
            }
        }
        
        // Industry risk factor (0-100)
        uint256 industryFactor = 100;
        uint256 industryMultiplier = industryRiskMultipliers[profile.industry];
        industryFactor = industryMultiplier <= 100 ? 100 : (10000 / industryMultiplier);
        
        // Age factor - higher score for businesses with more invoices
        uint256 ageFactor = profile.totalInvoices >= 20 ? 100 : (profile.totalInvoices * 5);
        
        // Weighted score calculation
        uint256 weightedScore = (
            (paymentHistoryFactor * paymentHistoryWeight) +
            (defaultRateFactor * defaultRateWeight) +
            (delayFactor * delayFactorWeight) +
            (industryFactor * industryFactorWeight) +
            (ageFactor * ageFactorWeight)
        ) / 100;
        
        // Ensure score is between 0 and 100
        newScore = weightedScore > 100 ? 100 : uint8(weightedScore);
        
        // Update profile
        profile.creditScore = newScore;
        profile.lastScoreUpdate = block.timestamp;
        
        // Determine risk level based on credit score
        uint8 riskLevel;
        if (newScore >= 90) riskLevel = 1; // Very low risk
        else if (newScore >= 75) riskLevel = 2; // Low risk
        else if (newScore >= 50) riskLevel = 3; // Medium risk
        else if (newScore >= 25) riskLevel = 4; // High risk
        else riskLevel = 5; // Very high risk
        
        profile.riskLevel = riskLevel;
        
        // Calculate recommended interest rate
        profile.recommendedRate = calculateBaseRate(riskLevel, profile.industry);
        
        emit CreditScoreUpdated(business, previousScore, newScore, riskLevel);
        return newScore;
    }
    
    /**
     * @dev Gets risk assessment for a business
     * @param business The address of the business
     * @return creditScore The credit score (0-100)
     * @return riskLevel The risk level (1-5)
     * @return recommendedRate The recommended interest rate in basis points
     */
    function getRiskAssessment(address business) external view returns (
        uint8 creditScore,
        uint8 riskLevel,
        uint256 recommendedRate
    ) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        BusinessProfile memory profile = businessProfiles[business];
        
        return (profile.creditScore, profile.riskLevel, profile.recommendedRate);
    }
    
    /**
     * @dev Verifies a business (for KYC/business verification)
     * @param business The address of the business
     * @param verified Whether the business is verified
     */
    function verifyBusiness(address business, bool verified) external onlyRole(VERIFIER_ROLE) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        businessProfiles[business].isVerified = verified;
        emit BusinessVerified(business, verified);
    }
    
    /**
     * @dev Updates the risk multiplier for an industry
     * @param industry The industry to update
     * @param multiplier The new multiplier (100 = neutral, >100 = higher risk, <100 = lower risk)
     */
    function updateIndustryRiskMultiplier(
        IndustryCategory industry,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(multiplier > 0 && multiplier <= 200, "Invalid multiplier range");
        industryRiskMultipliers[industry] = multiplier;
        emit IndustryRiskMultiplierUpdated(industry, multiplier);
    }
    
    /**
     * @dev Calculates a base interest rate based on risk level and industry
     * @param riskLevel The risk level (1-5)
     * @param industry The industry of the business
     * @return rate The recommended rate in basis points
     */
    function calculateBaseRate(uint8 riskLevel, IndustryCategory industry) public view returns (uint256 rate) {
        // Base rates by risk level (in basis points)
        uint256[5] memory baseRates = [300, 500, 800, 1200, 2000]; // 3% to 20%
        
        require(riskLevel >= 1 && riskLevel <= 5, "Invalid risk level");
        
        // Get base rate for risk level (subtract 1 since array is 0-indexed)
        uint256 baseRate = baseRates[riskLevel - 1];
        
        // Apply industry multiplier
        uint256 industryMultiplier = industryRiskMultipliers[industry];
        uint256 adjustedRate = (baseRate * industryMultiplier) / 100;
        
        return adjustedRate;
    }
    
    /**
     * @dev Gets the number of registered businesses
     * @return count The number of businesses
     */
    function getBusinessCount() external view returns (uint256 count) {
        return EnumerableSet.length(registeredBusinesses);
    }
    
    /**
     * @dev Gets a business by index
     * @param index The index of the business
     * @return businessAddress The address of the business
     */
    function getBusinessAtIndex(uint256 index) external view returns (address businessAddress) {
        require(index < EnumerableSet.length(registeredBusinesses), "Index out of bounds");
        return EnumerableSet.at(registeredBusinesses, index);
    }
    
    /**
     * @dev Gets the payment history for a business
     * @param business The address of the business
     * @param startIndex The starting index of the payment history
     * @param count The number of records to return
     * @return records The payment records
     */
    function getPaymentHistory(
        address business,
        uint256 startIndex,
        uint256 count
    ) external view returns (PaymentRecord[] memory records) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        
        uint256 totalRecords = paymentHistory[business].length;
        if (startIndex >= totalRecords) {
            return new PaymentRecord[](0);
        }
        
        // Calculate actual count to return (bounded by available records)
        uint256 actualCount = count;
        if (startIndex + count > totalRecords) {
            actualCount = totalRecords - startIndex;
        }
        
        records = new PaymentRecord[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            records[i] = paymentHistory[business][startIndex + i];
        }
        
        return records;
    }
    
    /**
     * @dev Gets a specific payment record
     * @param business The address of the business
     * @param recordId The ID of the record to get
     * @return record The payment record
     */
    function getPaymentRecord(
        address business,
        uint256 recordId
    ) external view returns (PaymentRecord memory record) {
        require(businessProfiles[business].profileId > 0, "Business not registered");
        require(recordId < paymentHistory[business].length, "Record not found");
        
        return paymentHistory[business][recordId];
    }
}
