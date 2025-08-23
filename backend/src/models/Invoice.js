const db = require('../config/database');

class Invoice {
  static async create(invoiceData) {
    const {
      userId,
      amount,
      dueDate,
      debtorName,
      debtorEmail,
      description,
      industry,
      invoiceNumber,
      creditScore,
      fraudScore,
      status,
      filePath,
      ipfsHash,
      debtorAddress
    } = invoiceData;

    const query = `
      INSERT INTO invoices (
        user_id, amount, due_date, debtor_name, debtor_email, 
        description, industry, invoice_number, credit_score, 
        fraud_score, status, file_path, ipfs_hash, debtor_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `;

    const result = await db.query(query, [
      userId, amount, dueDate, debtorName, debtorEmail,
      description, industry, invoiceNumber, creditScore,
      fraudScore, status, filePath, ipfsHash, debtorAddress
    ]);

    return result.rows[0].id;
  }

  static async findById(id) {
    const query = `
      SELECT i.*, u.company_name, u.first_name, u.last_name, u.wallet_address as issuer_address
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM invoices
      WHERE user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM invoices WHERE user_id = $1';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);

    return {
      invoices: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  }

  static async updateStatus(id, status, notes = null) {
    const query = `
      UPDATE invoices 
      SET status = $1, notes = $2, updated_at = NOW()
      WHERE id = $3
    `;
    await db.query(query, [status, notes, id]);
  }

  static async updateTokenId(id, tokenId) {
    const query = 'UPDATE invoices SET token_id = $1 WHERE id = $2';
    await db.query(query, [tokenId, id]);
  }

  static async updateBlockchainData(id, blockchainData) {
    const {
      tokenId,
      txHash,
      chainId,
      contractAddress,
      verificationStatus,
      tokenUri,
      lastPaymentTimestamp,
      lastPaymentAmount,
      totalPaidAmount
    } = blockchainData;

    const query = `
      UPDATE invoices 
      SET 
        token_id = COALESCE($1, token_id),
        tx_hash = COALESCE($2, tx_hash),
        chain_id = COALESCE($3, chain_id),
        contract_address = COALESCE($4, contract_address),
        verification_status = COALESCE($5, verification_status),
        token_uri = COALESCE($6, token_uri),
        last_payment_timestamp = COALESCE($7, last_payment_timestamp),
        last_payment_amount = COALESCE($8, last_payment_amount),
        total_paid_amount = COALESCE($9, total_paid_amount),
        updated_at = NOW()
      WHERE id = $10
    `;
    
    await db.query(query, [
      tokenId,
      txHash,
      chainId,
      contractAddress,
      verificationStatus,
      tokenUri,
      lastPaymentTimestamp,
      lastPaymentAmount,
      totalPaidAmount,
      id
    ]);
  }

  static async findByTokenId(tokenId, chainId = null) {
    let query = `
      SELECT i.*, u.company_name, u.first_name, u.last_name, u.wallet_address as issuer_address
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.token_id = $1
    `;
    
    const params = [tokenId];
    
    if (chainId !== null) {
      query += ` AND i.chain_id = $2`;
      params.push(chainId);
    }
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  static async recordPayment(id, paymentData) {
    const {
      amount,
      paymentDate = new Date(),
      paymentMethod,
      externalRef,
      txHash
    } = paymentData;

    // First update the invoice payment info
    const updateQuery = `
      UPDATE invoices
      SET 
        last_payment_timestamp = $1,
        last_payment_amount = $2,
        total_paid_amount = COALESCE(total_paid_amount, 0) + $2,
        updated_at = NOW(),
        status = CASE 
          WHEN COALESCE(total_paid_amount, 0) + $2 >= amount THEN 'paid'
          ELSE 'partially_paid'
        END
      WHERE id = $3
    `;
    
    await db.query(updateQuery, [
      paymentDate,
      amount,
      id
    ]);

    // Then insert the payment record
    const insertQuery = `
      INSERT INTO invoice_payments (
        invoice_id, amount, payment_date, payment_method, 
        external_reference, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      id, amount, paymentDate, paymentMethod, 
      externalRef, txHash
    ]);

    return result.rows[0].id;
  }

  static async getPaymentsByInvoiceId(invoiceId) {
    const query = `
      SELECT * FROM invoice_payments
      WHERE invoice_id = $1
      ORDER BY payment_date DESC
    `;
    
    const result = await db.query(query, [invoiceId]);
    return result.rows;
  }

  static async getAnalytics(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_invoices,
        COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_invoices,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'funded' THEN amount ELSE 0 END) as funded_amount,
        AVG(credit_score) as avg_credit_score,
        AVG(fraud_score) as avg_fraud_score
      FROM invoices
      WHERE user_id = $1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async getMarketplaceListings(filters = {}) {
    const { industry, minAmount, maxAmount, riskLevel, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = `
      SELECT i.*, u.company_name, u.credit_score as issuer_credit_score
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'verified' AND i.due_date > NOW()
    `;
    const params = [];

    if (industry) {
      query += ` AND i.industry = $${params.length + 1}`;
      params.push(industry);
    }

    if (minAmount) {
      query += ` AND i.amount >= $${params.length + 1}`;
      params.push(minAmount);
    }

    if (maxAmount) {
      query += ` AND i.amount <= $${params.length + 1}`;
      params.push(maxAmount);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async getOverdueInvoices() {
    const query = `
      SELECT * FROM invoices
      WHERE due_date < NOW() AND status NOT IN ('paid', 'cancelled')
    `;
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Invoice;