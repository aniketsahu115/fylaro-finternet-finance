// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./InvoiceToken.sol";

/**
 * @title InvoiceMarketplace
 * @dev Marketplace for trading invoice tokens
 */
contract InvoiceMarketplace is ReentrancyGuard, Ownable {
    InvoiceToken public invoiceToken;

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public tokenBids;
    mapping(uint256 => uint256) public highestBid;
    mapping(uint256 => address) public highestBidder;

    uint256 public platformFee = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 10%

    event TokenListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 expiresAt
    );

    event TokenSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    modifier onlyTokenOwner(uint256 _tokenId) {
        require(
            invoiceToken.ownerOf(_tokenId) == msg.sender,
            "Not token owner"
        );
        _;
    }

    modifier validListing(uint256 _tokenId) {
        require(listings[_tokenId].isActive, "Listing not active");
        require(
            block.timestamp < listings[_tokenId].expiresAt,
            "Listing expired"
        );
        _;
    }

    constructor(address _invoiceToken) {
        invoiceToken = InvoiceToken(_invoiceToken);
    }

    /**
     * @dev List token for sale
     */
    function listToken(
        uint256 _tokenId,
        uint256 _price,
        uint256 _duration
    ) public onlyTokenOwner(_tokenId) {
        require(_price > 0, "Price must be greater than 0");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");
        require(!listings[_tokenId].isActive, "Token already listed");

        // Ensure token is verified
        InvoiceToken.Invoice memory invoice = invoiceToken.getInvoice(_tokenId);
        require(invoice.isVerified, "Invoice not verified");
        require(!invoice.isPaid, "Invoice already paid");

        uint256 expiresAt = block.timestamp + _duration;

        listings[_tokenId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });

        emit TokenListed(_tokenId, msg.sender, _price, expiresAt);
    }

    /**
     * @dev Buy token at listed price
     */
    function buyToken(
        uint256 _tokenId
    ) public payable nonReentrant validListing(_tokenId) {
        Listing memory listing = listings[_tokenId];
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own token");

        // Calculate fees
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;

        // Mark listing as inactive
        listings[_tokenId].isActive = false;

        // Transfer token
        invoiceToken.safeTransferFrom(listing.seller, msg.sender, _tokenId);

        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit TokenSold(_tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Place bid on token
     */
    function placeBid(uint256 _tokenId) public payable nonReentrant {
        require(msg.value > 0, "Bid must be greater than 0");
        require(
            msg.value > highestBid[_tokenId],
            "Bid must be higher than current highest bid"
        );

        // Refund previous highest bidder
        if (highestBidder[_tokenId] != address(0)) {
            payable(highestBidder[_tokenId]).transfer(highestBid[_tokenId]);
        }

        // Update highest bid
        highestBid[_tokenId] = msg.value;
        highestBidder[_tokenId] = msg.sender;

        // Store bid
        tokenBids[_tokenId].push(
            Bid({
                bidder: msg.sender,
                amount: msg.value,
                createdAt: block.timestamp,
                isActive: true
            })
        );

        emit BidPlaced(_tokenId, msg.sender, msg.value);
    }

    /**
     * @dev Accept highest bid
     */
    function acceptBid(
        uint256 _tokenId
    ) public onlyTokenOwner(_tokenId) nonReentrant {
        require(highestBidder[_tokenId] != address(0), "No bids available");

        uint256 bidAmount = highestBid[_tokenId];
        address bidder = highestBidder[_tokenId];

        // Calculate fees
        uint256 fee = (bidAmount * platformFee) / 10000;
        uint256 sellerAmount = bidAmount - fee;

        // Clear bid data
        highestBid[_tokenId] = 0;
        highestBidder[_tokenId] = address(0);

        // Mark listing as inactive if exists
        if (listings[_tokenId].isActive) {
            listings[_tokenId].isActive = false;
        }

        // Transfer token
        invoiceToken.safeTransferFrom(msg.sender, bidder, _tokenId);

        // Transfer payment
        payable(msg.sender).transfer(sellerAmount);

        emit TokenSold(_tokenId, msg.sender, bidder, bidAmount);
    }

    /**
     * @dev Cancel listing
     */
    function cancelListing(uint256 _tokenId) public onlyTokenOwner(_tokenId) {
        require(listings[_tokenId].isActive, "Listing not active");

        listings[_tokenId].isActive = false;

        emit ListingCancelled(_tokenId, msg.sender);
    }

    /**
     * @dev Withdraw bid (only if not highest bidder)
     */
    function withdrawBid(uint256 _tokenId) public nonReentrant {
        require(
            msg.sender != highestBidder[_tokenId],
            "Cannot withdraw highest bid"
        );

        // Find and refund user's bid
        Bid[] storage bids = tokenBids[_tokenId];
        for (uint i = 0; i < bids.length; i++) {
            if (bids[i].bidder == msg.sender && bids[i].isActive) {
                bids[i].isActive = false;
                payable(msg.sender).transfer(bids[i].amount);
                break;
            }
        }
    }

    /**
     * @dev Get listing details
     */
    function getListing(uint256 _tokenId) public view returns (Listing memory) {
        return listings[_tokenId];
    }

    /**
     * @dev Get bid count for token
     */
    function getBidCount(uint256 _tokenId) public view returns (uint256) {
        return tokenBids[_tokenId].length;
    }

    /**
     * @dev Get bid details
     */
    function getBid(
        uint256 _tokenId,
        uint256 _bidIndex
    ) public view returns (Bid memory) {
        require(_bidIndex < tokenBids[_tokenId].length, "Invalid bid index");
        return tokenBids[_tokenId][_bidIndex];
    }

    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFee) public onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFee = _newFee;
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawFees() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Emergency function to refund all highest bids
     */
    function emergencyRefundBids(
        uint256[] calldata _tokenIds
    ) public onlyOwner {
        for (uint i = 0; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            if (highestBidder[tokenId] != address(0)) {
                payable(highestBidder[tokenId]).transfer(highestBid[tokenId]);
                highestBid[tokenId] = 0;
                highestBidder[tokenId] = address(0);
            }
        }
    }
}
