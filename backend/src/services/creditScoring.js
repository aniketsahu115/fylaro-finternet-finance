const AdvancedCreditScoring = require('./advancedCreditScoring');

class CreditScoring {
  constructor() {
    this.advancedScoring = new AdvancedCreditScoring();
  }

  async calculateScore(userId, invoiceData = null) {
    try {
      const result = await this.advancedScoring.calculateCreditScore(userId, invoiceData);
      return {
        score: result.finalScore || 650,
        risk: result.riskLevel || 'medium',
        factors: result.factors || {},
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Credit scoring error:', error);
      return {
        score: 650,
        risk: 'medium',
        factors: {},
        recommendations: ['Unable to calculate score - using default']
      };
    }
  }

  async assessInvoiceRisk(invoiceData) {
    try {
      const riskAssessment = await this.advancedScoring.assessInvoiceRisk(invoiceData);
      return {
        riskScore: riskAssessment.riskScore || 0.5,
        riskLevel: riskAssessment.riskLevel || 'medium',
        factors: riskAssessment.factors || {}
      };
    } catch (error) {
      console.error('Invoice risk assessment error:', error);
      return {
        riskScore: 0.5,
        riskLevel: 'medium',
        factors: {}
      };
    }
  }

  async getScoreFactors(userId) {
    try {
      return await this.advancedScoring.getDetailedAnalysis(userId);
    } catch (error) {
      console.error('Score factors error:', error);
      return {
        paymentHistory: { score: 650, weight: 0.35 },
        creditUtilization: { score: 650, weight: 0.30 },
        lengthOfHistory: { score: 650, weight: 0.15 },
        typesOfCredit: { score: 650, weight: 0.10 },
        newCredit: { score: 650, weight: 0.10 }
      };
    }
  }
}

module.exports = new CreditScoring();
