// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./InvoiceToken.sol";

/**
 * @title Settlement
 * @dev Automated settlement system for invoice payments
 */
contract Settlement is ReentrancyGuard, Ownable {
    InvoiceToken public invoiceToken;

    struct EscrowDeposit {
        uint256 tokenId;
        address payer;
        uint256 amount;
        uint256 depositTime;
        bool isReleased;
        bool isRefunded;
    }

    mapping(uint256 => EscrowDeposit) public escrowDeposits;
    mapping(address => uint256[]) public userEscrows;

    uint256 public escrowTimeout = 30 days;
    uint256 public platformFee = 100; // 1%

    event EscrowDeposited(
        uint256 indexed tokenId,
        address indexed payer,
        uint256 amount,
        uint256 depositTime
    );

    event PaymentReleased(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 amount
    );

    event PaymentRefunded(
        uint256 indexed tokenId,
        address indexed payer,
        uint256 amount
    );

    modifier validToken(uint256 _tokenId) {
        require(
            invoiceToken.ownerOf(_tokenId) != address(0),
            "Token does not exist"
        );
        _;
    }

    constructor(address _invoiceToken) {
        invoiceToken = InvoiceToken(_invoiceToken);
    }

    /**
     * @dev Deposit payment into escrow
     */
    function depositPayment(
        uint256 _tokenId
    ) public payable validToken(_tokenId) nonReentrant {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(
            escrowDeposits[_tokenId].amount == 0,
            "Payment already escrowed"
        );

        InvoiceToken.Invoice memory invoice = invoiceToken.getInvoice(_tokenId);
        require(!invoice.isPaid, "Invoice already paid");
        require(msg.value >= invoice.amount, "Insufficient payment amount");

        escrowDeposits[_tokenId] = EscrowDeposit({
            tokenId: _tokenId,
            payer: msg.sender,
            amount: msg.value,
            depositTime: block.timestamp,
            isReleased: false,
            isRefunded: false
        });

        userEscrows[msg.sender].push(_tokenId);

        emit EscrowDeposited(_tokenId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Release payment to invoice holder
     */
    function releasePayment(
        uint256 _tokenId
    ) public validToken(_tokenId) nonReentrant {
        EscrowDeposit storage deposit = escrowDeposits[_tokenId];
        require(deposit.amount > 0, "No escrow deposit found");
        require(!deposit.isReleased, "Payment already released");
        require(!deposit.isRefunded, "Payment already refunded");

        // Only debtor, token owner, or contract owner can release
        InvoiceToken.Invoice memory invoice = invoiceToken.getInvoice(_tokenId);
        require(
            msg.sender == invoice.debtor ||
                msg.sender == invoiceToken.ownerOf(_tokenId) ||
                msg.sender == owner(),
            "Not authorized to release payment"
        );

        deposit.isReleased = true;

        // Calculate fee
        uint256 fee = (deposit.amount * platformFee) / 10000;
        uint256 paymentAmount = deposit.amount - fee;

        // Mark invoice as paid
        invoiceToken.markInvoicePaid(_tokenId);

        // Transfer payment to current token holder
        address recipient = invoiceToken.ownerOf(_tokenId);
        payable(recipient).transfer(paymentAmount);

        emit PaymentReleased(_tokenId, recipient, paymentAmount);
    }

    /**
     * @dev Automatic release when conditions are met
     */
    function autoReleasePayment(uint256 _tokenId) public validToken(_tokenId) {
        EscrowDeposit storage deposit = escrowDeposits[_tokenId];
        require(deposit.amount > 0, "No escrow deposit found");
        require(!deposit.isReleased, "Payment already released");
        require(!deposit.isRefunded, "Payment already refunded");

        InvoiceToken.Invoice memory invoice = invoiceToken.getInvoice(_tokenId);

        // Auto-release conditions:
        // 1. Invoice due date has passed and no dispute
        // 2. Escrow timeout has been reached
        bool canAutoRelease = (block.timestamp > invoice.dueDate + 7 days ||
            block.timestamp > deposit.depositTime + escrowTimeout);

        require(canAutoRelease, "Conditions not met for auto-release");

        deposit.isReleased = true;

        uint256 fee = (deposit.amount * platformFee) / 10000;
        uint256 paymentAmount = deposit.amount - fee;

        invoiceToken.markInvoicePaid(_tokenId);

        address recipient = invoiceToken.ownerOf(_tokenId);
        payable(recipient).transfer(paymentAmount);

        emit PaymentReleased(_tokenId, recipient, paymentAmount);
    }

    /**
     * @dev Refund payment to payer
     */
    function refundPayment(
        uint256 _tokenId
    ) public validToken(_tokenId) nonReentrant {
        EscrowDeposit storage deposit = escrowDeposits[_tokenId];
        require(deposit.amount > 0, "No escrow deposit found");
        require(!deposit.isReleased, "Payment already released");
        require(!deposit.isRefunded, "Payment already refunded");

        // Only contract owner can initiate refunds (dispute resolution)
        require(msg.sender == owner(), "Only owner can refund");

        deposit.isRefunded = true;

        payable(deposit.payer).transfer(deposit.amount);

        emit PaymentRefunded(_tokenId, deposit.payer, deposit.amount);
    }

    /**
     * @dev Emergency refund for payer after timeout
     */
    function emergencyRefund(
        uint256 _tokenId
    ) public validToken(_tokenId) nonReentrant {
        EscrowDeposit storage deposit = escrowDeposits[_tokenId];
        require(deposit.payer == msg.sender, "Not the payer");
        require(deposit.amount > 0, "No escrow deposit found");
        require(!deposit.isReleased, "Payment already released");
        require(!deposit.isRefunded, "Payment already refunded");

        // Allow emergency refund after extended timeout
        require(
            block.timestamp > deposit.depositTime + (escrowTimeout * 2),
            "Emergency timeout not reached"
        );

        deposit.isRefunded = true;

        payable(deposit.payer).transfer(deposit.amount);

        emit PaymentRefunded(_tokenId, deposit.payer, deposit.amount);
    }

    /**
     * @dev Get escrow details
     */
    function getEscrowDeposit(
        uint256 _tokenId
    ) public view returns (EscrowDeposit memory) {
        return escrowDeposits[_tokenId];
    }

    /**
     * @dev Get user's escrow token IDs
     */
    function getUserEscrows(
        address _user
    ) public view returns (uint256[] memory) {
        return userEscrows[_user];
    }

    /**
     * @dev Check if payment can be auto-released
     */
    function canAutoRelease(uint256 _tokenId) public view returns (bool) {
        EscrowDeposit memory deposit = escrowDeposits[_tokenId];
        if (deposit.amount == 0 || deposit.isReleased || deposit.isRefunded) {
            return false;
        }

        InvoiceToken.Invoice memory invoice = invoiceToken.getInvoice(_tokenId);

        return (block.timestamp > invoice.dueDate + 7 days ||
            block.timestamp > deposit.depositTime + escrowTimeout);
    }

    /**
     * @dev Update escrow timeout
     */
    function updateEscrowTimeout(uint256 _newTimeout) public onlyOwner {
        require(
            _newTimeout >= 1 days && _newTimeout <= 90 days,
            "Invalid timeout"
        );
        escrowTimeout = _newTimeout;
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= 500, "Fee too high"); // Max 5%
        platformFee = _newFee;
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Batch auto-release for multiple tokens
     */
    function batchAutoRelease(uint256[] calldata _tokenIds) public {
        for (uint i = 0; i < _tokenIds.length; i++) {
            if (canAutoRelease(_tokenIds[i])) {
                autoReleasePayment(_tokenIds[i]);
            }
        }
    }
}
