// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./InvoiceToken.sol";

/**
 * @title PaymentTracker
 * @dev Automated payment tracking, settlement, and return distribution for invoice financing
 */
contract PaymentTracker is ReentrancyGuard, AccessControl {
    using EnumerableSet for EnumerableSet.UintSet;

    // Roles
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Invoice token contract
    InvoiceToken public invoiceToken;

    // Payment methods
    enum PaymentMethod {
        Crypto,
        BankTransfer,
        ACH,
        Wire,
        Check,
        Cash,
        Other
    }

    // Payment status
    enum PaymentStatus {
        Scheduled,
        PartiallyPaid,
        Paid,
        Overdue,
        InGracePeriod,
        Default,
        Recovered
    }

    // Payment schedule structure
    struct PaymentSchedule {
        uint256 invoiceId;
        uint256 expectedAmount;
        uint256 dueDate;
        uint256 gracePeriod; // In days
        address debtor;
        address[] investors;
        uint256[] investorShares; // Basis points (e.g., 5000 = 50%)
        PaymentStatus status;
        uint256 createdAt;
        uint256 lastUpdated;
        bool settled;
    }

    // Payment record structure
    struct Payment {
        uint256 paymentId;
        uint256 invoiceId;
        uint256 amount;
        address payer;
        PaymentMethod method;
        string externalRef;
        uint256 timestamp;
        bool processed;
    }

    // Recovery record structure
    struct Recovery {
        uint256 invoiceId;
        uint256 recoveredAmount;
        uint256 timestamp;
        string notes;
        bool processed;
    }

    // Distribution record structure
    struct Distribution {
        uint256 invoiceId;
        address investor;
        uint256 amount;
        uint256 timestamp;
        bool success;
    }

    // Mappings
    mapping(uint256 => PaymentSchedule) public paymentSchedules;
    mapping(uint256 => Payment[]) public invoicePayments;
    mapping(uint256 => Recovery[]) public invoiceRecoveries;
    mapping(uint256 => Distribution[]) public invoiceDistributions;
    mapping(uint256 => uint256) public invoiceTotalPaid;
    mapping(address => EnumerableSet.UintSet) private userInvoices;

    // Platform fees
    uint256 public platformFeePercentage = 100; // 1% in basis points
    address public feeCollector;

    // Events
    event PaymentScheduleCreated(
        uint256 indexed invoiceId,
        uint256 expectedAmount,
        uint256 dueDate
    );
    event PaymentReceived(
        uint256 indexed invoiceId,
        uint256 indexed paymentId,
        uint256 amount,
        address payer
    );
    event PaymentStatusUpdated(
        uint256 indexed invoiceId,
        PaymentStatus newStatus
    );
    event InvoiceSettled(uint256 indexed invoiceId, uint256 totalAmount);
    event InvoiceDefaulted(uint256 indexed invoiceId, uint256 unpaidAmount);
    event RecoveryRecorded(uint256 indexed invoiceId, uint256 recoveredAmount);
    event ReturnsDistributed(
        uint256 indexed invoiceId,
        uint256 totalDistributed,
        uint256 feeCollected
    );
    event InvestorPaid(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 amount
    );

    /**
     * @dev Constructor
     * @param _invoiceToken The address of the invoice token contract
     * @param _feeCollector The address that collects platform fees
     */
    constructor(address _invoiceToken, address _feeCollector) {
        require(_invoiceToken != address(0), "Invalid invoice token address");
        require(_feeCollector != address(0), "Invalid fee collector address");

        invoiceToken = InvoiceToken(_invoiceToken);
        feeCollector = _feeCollector;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MANAGER_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Creates a payment schedule for an invoice
     * @param invoiceId The ID of the invoice
     * @param expectedAmount The expected payment amount
     * @param dueDate The due date for the payment
     * @param gracePeriod The grace period in days
     * @param debtor The debtor who should make the payment
     */
    function createPaymentSchedule(
        uint256 invoiceId,
        uint256 expectedAmount,
        uint256 dueDate,
        uint256 gracePeriod,
        address debtor
    ) external onlyRole(MANAGER_ROLE) returns (bool) {
        require(
            paymentSchedules[invoiceId].invoiceId == 0,
            "Payment schedule already exists"
        );
        require(
            expectedAmount > 0,
            "Expected amount must be greater than zero"
        );
        require(dueDate > block.timestamp, "Due date must be in the future");

        // Get invoice details from token contract
        (address issuer, uint256 totalShares, bool isVerified) = invoiceToken
            .getInvoiceDetails(invoiceId);
        require(isVerified, "Invoice not verified");

        // Get investors and their shares
        (address[] memory investors, uint256[] memory shares) = invoiceToken
            .getInvestors(invoiceId);
        require(investors.length > 0, "No investors found");
        require(
            investors.length == shares.length,
            "Investors and shares mismatch"
        );

        PaymentSchedule memory schedule = PaymentSchedule({
            invoiceId: invoiceId,
            expectedAmount: expectedAmount,
            dueDate: dueDate,
            gracePeriod: gracePeriod,
            debtor: debtor,
            investors: investors,
            investorShares: shares,
            status: PaymentStatus.Scheduled,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp,
            settled: false
        });

        paymentSchedules[invoiceId] = schedule;

        // Add invoice to debtor's tracking
        EnumerableSet.add(userInvoices[debtor], invoiceId);

        emit PaymentScheduleCreated(invoiceId, expectedAmount, dueDate);
        return true;
    }

    /**
     * @dev Records a payment for an invoice
     * @param invoiceId The ID of the invoice
     * @param amount The payment amount
     * @param payer The payer's address
     * @param method The payment method
     * @param externalRef External reference for the payment (e.g., transaction ID)
     * @return paymentId The ID of the payment
     */
    function recordPayment(
        uint256 invoiceId,
        uint256 amount,
        address payer,
        PaymentMethod method,
        string calldata externalRef
    ) external returns (uint256 paymentId) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );
        require(amount > 0, "Payment amount must be greater than zero");

        PaymentSchedule storage schedule = paymentSchedules[invoiceId];

        // Create payment record
        Payment memory payment = Payment({
            paymentId: invoicePayments[invoiceId].length,
            invoiceId: invoiceId,
            amount: amount,
            payer: payer,
            method: method,
            externalRef: externalRef,
            timestamp: block.timestamp,
            processed: false
        });

        invoicePayments[invoiceId].push(payment);
        invoiceTotalPaid[invoiceId] += amount;

        emit PaymentReceived(invoiceId, payment.paymentId, amount, payer);

        // Update payment status
        updatePaymentStatus(invoiceId);

        // Auto-settle if payment is complete
        if (schedule.status == PaymentStatus.Paid && !schedule.settled) {
            autoSettle(invoiceId);
        }

        return payment.paymentId;
    }

    /**
     * @dev Records a crypto payment (sends ETH directly to contract)
     * @param invoiceId The ID of the invoice
     * @return success Whether the payment was successful
     */
    function makeCryptoPayment(
        uint256 invoiceId
    ) external payable returns (bool success) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );
        require(msg.value > 0, "Payment amount must be greater than zero");

        // Record the payment with crypto method
        recordPayment(
            invoiceId,
            msg.value,
            msg.sender,
            PaymentMethod.Crypto,
            "ETH_DIRECT"
        );

        return true;
    }

    /**
     * @dev Updates the payment status of an invoice based on payments and due date
     * @param invoiceId The ID of the invoice
     * @return status The new payment status
     */
    function updatePaymentStatus(
        uint256 invoiceId
    ) public returns (PaymentStatus status) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );

        PaymentSchedule storage schedule = paymentSchedules[invoiceId];
        uint256 totalPaid = invoiceTotalPaid[invoiceId];

        // Already settled
        if (schedule.settled) {
            return schedule.status;
        }

        // Check if fully paid
        if (totalPaid >= schedule.expectedAmount) {
            schedule.status = PaymentStatus.Paid;
        }
        // Check if partially paid
        else if (totalPaid > 0) {
            schedule.status = PaymentStatus.PartiallyPaid;
        }

        // Check if overdue or in grace period
        if (
            schedule.status != PaymentStatus.Paid &&
            block.timestamp > schedule.dueDate
        ) {
            uint256 gracePeriodEnd = schedule.dueDate +
                (schedule.gracePeriod * 1 days);

            if (block.timestamp <= gracePeriodEnd) {
                schedule.status = PaymentStatus.InGracePeriod;
            } else {
                schedule.status = PaymentStatus.Overdue;
            }
        }

        // Auto-default if significantly overdue (grace period + 30 days)
        if (schedule.status == PaymentStatus.Overdue) {
            uint256 defaultThreshold = schedule.dueDate +
                (schedule.gracePeriod * 1 days) +
                30 days;
            if (block.timestamp > defaultThreshold) {
                schedule.status = PaymentStatus.Default;
                emit InvoiceDefaulted(
                    invoiceId,
                    schedule.expectedAmount - totalPaid
                );
            }
        }

        schedule.lastUpdated = block.timestamp;
        emit PaymentStatusUpdated(invoiceId, schedule.status);

        return schedule.status;
    }

    /**
     * @dev Automatically settles an invoice when fully paid
     * @param invoiceId The ID of the invoice
     * @return success Whether the settlement was successful
     */
    function autoSettle(
        uint256 invoiceId
    ) public nonReentrant returns (bool success) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );

        PaymentSchedule storage schedule = paymentSchedules[invoiceId];
        require(!schedule.settled, "Invoice already settled");

        uint256 totalPaid = invoiceTotalPaid[invoiceId];
        require(totalPaid >= schedule.expectedAmount, "Invoice not fully paid");

        // Mark as settled
        schedule.settled = true;
        schedule.status = PaymentStatus.Paid;
        schedule.lastUpdated = block.timestamp;

        emit InvoiceSettled(invoiceId, totalPaid);

        // Distribute returns to investors
        distributeReturns(invoiceId);

        return true;
    }

    /**
     * @dev Handles default cases and records recovery amount
     * @param invoiceId The ID of the invoice
     * @param recoveryAmount The amount recovered after default
     * @return success Whether the recovery was successful
     */
    function handleDefault(
        uint256 invoiceId,
        uint256 recoveryAmount
    ) external onlyRole(MANAGER_ROLE) returns (bool success) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );

        PaymentSchedule storage schedule = paymentSchedules[invoiceId];
        require(
            schedule.status == PaymentStatus.Default,
            "Invoice not in default status"
        );
        require(!schedule.settled, "Invoice already settled");

        Recovery memory recovery = Recovery({
            invoiceId: invoiceId,
            recoveredAmount: recoveryAmount,
            timestamp: block.timestamp,
            notes: "Default recovery",
            processed: false
        });

        invoiceRecoveries[invoiceId].push(recovery);
        invoiceTotalPaid[invoiceId] += recoveryAmount;

        // Update status to recovered
        schedule.status = PaymentStatus.Recovered;
        schedule.lastUpdated = block.timestamp;

        emit RecoveryRecorded(invoiceId, recoveryAmount);
        emit PaymentStatusUpdated(invoiceId, PaymentStatus.Recovered);

        // Settle with partial payment
        schedule.settled = true;
        emit InvoiceSettled(invoiceId, invoiceTotalPaid[invoiceId]);

        // Distribute recovered amount
        distributeReturns(invoiceId);

        return true;
    }

    /**
     * @dev Distributes returns to investors based on their shares
     * @param invoiceId The ID of the invoice
     * @return totalDistributed The total amount distributed
     */
    function distributeReturns(
        uint256 invoiceId
    ) public nonReentrant returns (uint256 totalDistributed) {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );

        PaymentSchedule storage schedule = paymentSchedules[invoiceId];
        require(schedule.settled, "Invoice not settled");

        uint256 totalAmount = invoiceTotalPaid[invoiceId];

        // Calculate platform fee
        uint256 feeAmount = (totalAmount * platformFeePercentage) / 10000;
        uint256 distributionAmount = totalAmount - feeAmount;

        // Transfer fee to fee collector
        if (feeAmount > 0 && address(this).balance >= feeAmount) {
            payable(feeCollector).transfer(feeAmount);
        }

        // Distribute to investors
        totalDistributed = 0;

        for (uint256 i = 0; i < schedule.investors.length; i++) {
            address investor = schedule.investors[i];
            uint256 share = schedule.investorShares[i];

            uint256 investorAmount = (distributionAmount * share) / 10000;

            Distribution memory distribution = Distribution({
                invoiceId: invoiceId,
                investor: investor,
                amount: investorAmount,
                timestamp: block.timestamp,
                success: false
            });

            // Transfer funds to investor
            if (investorAmount > 0 && address(this).balance >= investorAmount) {
                payable(investor).transfer(investorAmount);
                distribution.success = true;
                totalDistributed += investorAmount;

                emit InvestorPaid(invoiceId, investor, investorAmount);
            }

            invoiceDistributions[invoiceId].push(distribution);
        }

        emit ReturnsDistributed(invoiceId, totalDistributed, feeAmount);
        return totalDistributed;
    }

    /**
     * @dev Gets payment schedule for an invoice
     * @param invoiceId The ID of the invoice
     * @return schedule The payment schedule
     */
    function getPaymentSchedule(
        uint256 invoiceId
    )
        external
        view
        returns (
            uint256 expectedAmount,
            uint256 dueDate,
            uint256 gracePeriod,
            address debtor,
            PaymentStatus status,
            bool settled
        )
    {
        require(
            paymentSchedules[invoiceId].invoiceId != 0,
            "Payment schedule not found"
        );

        PaymentSchedule memory schedule = paymentSchedules[invoiceId];

        return (
            schedule.expectedAmount,
            schedule.dueDate,
            schedule.gracePeriod,
            schedule.debtor,
            schedule.status,
            schedule.settled
        );
    }

    /**
     * @dev Gets all payments for an invoice
     * @param invoiceId The ID of the invoice
     * @return payments Array of payments
     */
    function getInvoicePayments(
        uint256 invoiceId
    ) external view returns (Payment[] memory payments) {
        return invoicePayments[invoiceId];
    }

    /**
     * @dev Gets all distributions for an invoice
     * @param invoiceId The ID of the invoice
     * @return distributions Array of distributions
     */
    function getInvoiceDistributions(
        uint256 invoiceId
    ) external view returns (Distribution[] memory distributions) {
        return invoiceDistributions[invoiceId];
    }

    /**
     * @dev Gets invoices for a user (debtor)
     * @param user The user's address
     * @return result Array of invoice IDs
     */
    function getUserInvoices(
        address user
    ) external view returns (uint256[] memory result) {
        uint256 length = EnumerableSet.length(userInvoices[user]);
        result = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            result[i] = EnumerableSet.at(userInvoices[user], i);
        }

        return result;
    }

    /**
     * @dev Sets the platform fee percentage (in basis points)
     * @param newFeePercentage The new fee percentage (e.g., 100 = 1%)
     */
    function setPlatformFee(
        uint256 newFeePercentage
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Sets the fee collector address
     * @param newFeeCollector The new fee collector address
     */
    function setFeeCollector(
        address newFeeCollector
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeCollector != address(0), "Invalid address");
        feeCollector = newFeeCollector;
    }

    /**
     * @dev Sets the invoice token contract address
     * @param newInvoiceToken The new invoice token contract address
     */
    function setInvoiceToken(
        address newInvoiceToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newInvoiceToken != address(0), "Invalid address");
        invoiceToken = InvoiceToken(newInvoiceToken);
    }

    /**
     * @dev Allows contract to receive ETH payments
     */
    receive() external payable {
        // Allow receiving ETH
    }

    /**
     * @dev Allows admin to withdraw any stuck funds
     * @param amount The amount to withdraw
     */
    function adminWithdraw(
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(msg.sender).transfer(amount);
    }
}
