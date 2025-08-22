const db = require('../config/database');

class User {
  static async create(userData) {
    const {
      email,
      password,
      userType,
      companyName,
      firstName,
      lastName,
      creditScore
    } = userData;

    const query = `
      INSERT INTO users (email, password_hash, user_type, company_name, first_name, last_name, credit_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await db.query(query, [
      email,
      password,
      userType,
      companyName,
      firstName,
      lastName,
      creditScore
    ]);

    return result.rows[0].id;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) return;

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
    `;
    values.push(id);

    await db.query(query, values);
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await db.query(query, [id]);
  }

  static async updateCreditScore(id, newScore) {
    const query = 'UPDATE users SET credit_score = $1, updated_at = NOW() WHERE id = $2';
    await db.query(query, [newScore, id]);
  }

  static async getByWalletAddress(walletAddress) {
    const query = 'SELECT * FROM users WHERE wallet_address = $1';
    const result = await db.query(query, [walletAddress]);
    return result.rows[0];
  }

  static async getUserStats(id) {
    const query = `
      SELECT 
        u.*,
        COUNT(i.id) as total_invoices,
        SUM(CASE WHEN i.status = 'funded' THEN i.amount ELSE 0 END) as total_funded,
        AVG(i.credit_score) as avg_credit_score
      FROM users u
      LEFT JOIN invoices i ON u.id = i.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;