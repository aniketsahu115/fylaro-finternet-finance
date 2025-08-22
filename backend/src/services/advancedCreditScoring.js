const axios = require('axios');

class AdvancedCreditScoring {
  constructor() {
    this.weights = {
      paymentHistory: 0.35,     // 35% - Most important factor
      creditUtilization: 0.30,  // 30% - Current debt vs available credit
      lengthOfHistory: 0.15,    // 15% - How long credit history exists
      typesOfCredit: 0.10,      // 10% - Mix of credit types
      newCredit: 0.10           // 10% - Recent credit inquiries
    };

    this.industryRiskFactors = {
      technology: { baseRisk: 0.15, volatilityFactor: 1.2 },
      healthcare: { baseRisk: 0.08, volatilityFactor: 0.8 },
      energy: { baseRisk: 0.12, volatilityFactor: 1.1 },
      retail: { baseRisk: 0.18, volatilityFactor: 1.3 },
      manufacturing: { baseRisk: 0.10, volatilityFactor: 0.9 },
      other: { baseRisk: 0.20, volatilityFactor: 1.0 }
    };
  }

  /**
   * Calculate comprehensive credit score
   */
  async calculateCreditScore(userId, invoiceData = null) {
    try {
      const [
        paymentHistory,
        creditUtilization,
        lengthOfHistory,
        typesOfCredit,
        newCreditActivity,
        externalData,
        industryRisk
      ] = await Promise.all([
        this.analyzePaymentHistory(userId),
        this.analyzeCreditUtilization(userId),
        this.analyzeLengthOfHistory(userId),
        this.analyzeTypesOfCredit(userId),
        this.analyzeNewCreditActivity(userId),
        this.getExternalCreditData(userId),
        invoiceData ? this.analyzeIndustryRisk(invoiceData.industry) : { score: 750, risk: 0.1 }
      ]);

      // Calculate base score using weighted factors
      const baseScore = this.calculateWeightedScore({
        paymentHistory: paymentHistory.score,
        creditUtilization: creditUtilization.score,
        lengthOfHistory: lengthOfHistory.score,
        typesOfCredit: typesOfCredit.score,
        newCredit: newCreditActivity.score
      });

      // Apply external data and industry adjustments
      const adjustedScore = this.applyAdjustments(baseScore, {
        externalData,
        industryRisk,
        invoiceData
      });

      // Generate detailed breakdown
      const scoreBreakdown = {
        finalScore: Math.round(adjustedScore),
        components: {
          paymentHistory: {
            score: paymentHistory.score,
            weight: this.weights.paymentHistory,
            contribution: paymentHistory.score * this.weights.paymentHistory,
            details: paymentHistory.details
          },
          creditUtilization: {
            score: creditUtilization.score,
            weight: this.weights.creditUtilization,
            contribution: creditUtilization.score * this.weights.creditUtilization,
            details: creditUtilization.details
          },
          lengthOfHistory: {
            score: lengthOfHistory.score,
            weight: this.weights.lengthOfHistory,
            contribution: lengthOfHistory.score * this.weights.lengthOfHistory,
            details: lengthOfHistory.details
          },
          typesOfCredit: {
            score: typesOfCredit.score,
            weight: this.weights.typesOfCredit,
            contribution: typesOfCredit.score * this.weights.typesOfCredit,
            details: typesOfCredit.details
          },
          newCredit: {
            score: newCreditActivity.score,
            weight: this.weights.newCredit,
            contribution: newCreditActivity.score * this.weights.newCredit,
            details: newCreditActivity.details
          }
        },
        adjustments: {
          industryRisk: industryRisk,
          externalData: externalData,
          invoiceSpecific: invoiceData ? this.analyzeInvoiceRisk(invoiceData) : null
        },
        riskLevel: this.determineRiskLevel(adjustedScore),
        recommendations: this.generateRecommendations(adjustedScore, {
          paymentHistory,
          creditUtilization,
          lengthOfHistory,
          typesOfCredit,
          newCreditActivity
        })
      };

      return scoreBreakdown;
    } catch (error) {
      throw new Error(`Credit score calculation failed: ${error.message}`);
    }
  }

  calculateWeightedScore(scores) {
    return Object.entries(scores).reduce((total, [component, score]) => {
      return total + (score * this.weights[component]);
    }, 0);
  }

  async analyzePaymentHistory(userId) {
    // Query user's payment history from database
    const payments = await this.getUserPaymentHistory(userId);
    
    if (payments.length === 0) {
      return {
        score: 650, // Neutral score for new users
        details: {
          totalPayments: 0,
          onTimePayments: 0,
          latePayments: 0,
          averageDaysLate: 0,
          longestDelayDays: 0
        }
      };
    }

    const onTimePayments = payments.filter(p => p.daysLate <= 0).length;
    const latePayments = payments.filter(p => p.daysLate > 0).length;
    const totalPayments = payments.length;
    const onTimeRatio = onTimePayments / totalPayments;

    // Calculate average days late for late payments
    const lateDays = payments.filter(p => p.daysLate > 0).map(p => p.daysLate);
    const averageDaysLate = lateDays.length > 0 ? lateDays.reduce((a, b) => a + b, 0) / lateDays.length : 0;
    const longestDelayDays = Math.max(...lateDays, 0);

    // Score calculation (300-850 range)
    let score = 850;
    
    // Penalize based on late payment ratio
    score -= (1 - onTimeRatio) * 200;
    
    // Additional penalty for severity of lateness
    if (averageDaysLate > 30) score -= 50;
    if (averageDaysLate > 60) score -= 50;
    if (longestDelayDays > 90) score -= 100;

    return {
      score: Math.max(300, Math.min(850, score)),
      details: {
        totalPayments,
        onTimePayments,
        latePayments,
        onTimeRatio: Math.round(onTimeRatio * 100),
        averageDaysLate: Math.round(averageDaysLate),
        longestDelayDays
      }
    };
  }

  async analyzeCreditUtilization(userId) {
    const creditData = await this.getUserCreditData(userId);
    
    if (!creditData || creditData.totalCreditLimit === 0) {
      return {
        score: 700,
        details: {
          totalCreditUsed: 0,
          totalCreditLimit: 0,
          utilizationRatio: 0,
          recommendation: 'Establish credit history'
        }
      };
    }

    const utilizationRatio = creditData.totalCreditUsed / creditData.totalCreditLimit;
    
    // Optimal utilization is below 30%
    let score = 850;
    if (utilizationRatio > 0.30) score -= 100;
    if (utilizationRatio > 0.50) score -= 50;
    if (utilizationRatio > 0.70) score -= 50;
    if (utilizationRatio > 0.90) score -= 100;

    return {
      score: Math.max(300, score),
      details: {
        totalCreditUsed: creditData.totalCreditUsed,
        totalCreditLimit: creditData.totalCreditLimit,
        utilizationRatio: Math.round(utilizationRatio * 100),
        recommendation: utilizationRatio > 0.30 ? 'Consider reducing credit utilization below 30%' : 'Good credit utilization'
      }
    };
  }

  async analyzeLengthOfHistory(userId) {
    const accountAge = await this.getUserAccountAge(userId);
    const firstInvoiceDate = await this.getFirstInvoiceDate(userId);
    
    const totalHistoryMonths = accountAge || 0;
    const invoiceHistoryMonths = firstInvoiceDate ? 
      Math.floor((Date.now() - firstInvoiceDate) / (1000 * 60 * 60 * 24 * 30)) : 0;

    // Score based on length of history
    let score = 300;
    score += Math.min(totalHistoryMonths * 5, 300); // Up to 60 months for max score
    score += Math.min(invoiceHistoryMonths * 3, 150); // Additional points for invoice history

    return {
      score: Math.min(850, score),
      details: {
        accountAgeMonths: totalHistoryMonths,
        invoiceHistoryMonths: invoiceHistoryMonths,
        recommendation: totalHistoryMonths < 12 ? 'Continue building credit history' : 'Good credit history length'
      }
    };
  }

  async analyzeTypesOfCredit(userId) {
    const creditTypes = await this.getUserCreditTypes(userId);
    
    const typeCount = Object.keys(creditTypes).length;
    const hasInvoiceFinancing = creditTypes.invoiceFinancing || false;
    const hasTraditionalCredit = creditTypes.traditional || false;
    const hasCryptocurrency = creditTypes.cryptocurrency || false;

    let score = 600;
    score += typeCount * 30; // Points for diversity
    if (hasInvoiceFinancing) score += 50;
    if (hasTraditionalCredit) score += 40;
    if (hasCryptocurrency) score += 30;

    return {
      score: Math.min(850, score),
      details: {
        creditTypesCount: typeCount,
        hasInvoiceFinancing,
        hasTraditionalCredit,
        hasCryptocurrency,
        recommendation: typeCount < 3 ? 'Consider diversifying credit types' : 'Good credit mix'
      }
    };
  }

  async analyzeNewCreditActivity(userId) {
    const recentInquiries = await this.getRecentCreditInquiries(userId);
    const recentAccounts = await this.getRecentAccounts(userId);
    
    const inquiriesLast6Months = recentInquiries.filter(
      i => i.date > Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)
    ).length;
    
    const accountsLast12Months = recentAccounts.filter(
      a => a.openDate > Date.now() - (12 * 30 * 24 * 60 * 60 * 1000)
    ).length;

    let score = 800;
    score -= inquiriesLast6Months * 20; // Penalty for hard inquiries
    score -= accountsLast12Months * 15; // Penalty for new accounts

    return {
      score: Math.max(300, score),
      details: {
        inquiriesLast6Months,
        accountsLast12Months,
        recommendation: inquiriesLast6Months > 3 ? 'Reduce credit applications' : 'Good new credit activity'
      }
    };
  }

  async getExternalCreditData(userId) {
    try {
      // Simulate external credit bureau API call
      // In production, integrate with actual credit bureaus
      const externalScore = Math.floor(Math.random() * 300) + 550;
      
      return {
        bureauScore: externalScore,
        available: true,
        lastUpdated: Date.now()
      };
    } catch (error) {
      return {
        bureauScore: null,
        available: false,
        error: error.message
      };
    }
  }

  analyzeIndustryRisk(industry) {
    const riskFactor = this.industryRiskFactors[industry] || this.industryRiskFactors.other;
    
    const baseScore = 750;
    const adjustment = riskFactor.baseRisk * 100;
    
    return {
      score: Math.round(baseScore - adjustment),
      risk: riskFactor.baseRisk,
      volatility: riskFactor.volatilityFactor,
      industry
    };
  }

  analyzeInvoiceRisk(invoiceData) {
    const riskFactors = {
      amount: this.analyzeAmountRisk(invoiceData.amount),
      dueDate: this.analyzeDueDateRisk(invoiceData.dueDate),
      debtor: this.analyzeDebtorRisk(invoiceData.debtor),
      industry: this.analyzeIndustryRisk(invoiceData.industry)
    };

    const totalRisk = Object.values(riskFactors).reduce((sum, factor) => sum + factor.risk, 0) / 4;
    
    return {
      overallRisk: totalRisk,
      riskFactors,
      recommendation: totalRisk > 0.5 ? 'High risk invoice' : totalRisk > 0.3 ? 'Medium risk invoice' : 'Low risk invoice'
    };
  }

  analyzeAmountRisk(amount) {
    // Higher amounts generally carry higher risk
    if (amount > 1000000) return { risk: 0.4, reason: 'Very high amount' };
    if (amount > 500000) return { risk: 0.3, reason: 'High amount' };
    if (amount > 100000) return { risk: 0.2, reason: 'Medium-high amount' };
    if (amount > 50000) return { risk: 0.15, reason: 'Medium amount' };
    return { risk: 0.1, reason: 'Low amount' };
  }

  analyzeDueDateRisk(dueDate) {
    const daysUntilDue = Math.floor((new Date(dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return { risk: 0.8, reason: 'Past due' };
    if (daysUntilDue < 7) return { risk: 0.6, reason: 'Due very soon' };
    if (daysUntilDue < 30) return { risk: 0.3, reason: 'Due soon' };
    if (daysUntilDue < 90) return { risk: 0.1, reason: 'Normal payment terms' };
    return { risk: 0.2, reason: 'Extended payment terms' };
  }

  analyzeDebtorRisk(debtorInfo) {
    // This would integrate with business credit scoring services
    // For now, return a simulated risk assessment
    const baseRisk = 0.15;
    return { risk: baseRisk, reason: 'Standard debtor risk assessment' };
  }

  applyAdjustments(baseScore, adjustments) {
    let adjustedScore = baseScore;

    // Apply external credit data if available
    if (adjustments.externalData?.available && adjustments.externalData.bureauScore) {
      // Weight external score at 20%
      adjustedScore = (adjustedScore * 0.8) + (adjustments.externalData.bureauScore * 0.2);
    }

    // Apply industry risk
    if (adjustments.industryRisk) {
      adjustedScore *= (1 - adjustments.industryRisk.risk * 0.1);
    }

    // Apply invoice-specific adjustments
    if (adjustments.invoiceData) {
      const invoiceRisk = this.analyzeInvoiceRisk(adjustments.invoiceData);
      adjustedScore *= (1 - invoiceRisk.overallRisk * 0.05);
    }

    return Math.max(300, Math.min(850, adjustedScore));
  }

  determineRiskLevel(score) {
    if (score >= 750) return { level: 'Low', description: 'Excellent credit' };
    if (score >= 700) return { level: 'Low-Medium', description: 'Good credit' };
    if (score >= 650) return { level: 'Medium', description: 'Fair credit' };
    if (score >= 600) return { level: 'Medium-High', description: 'Below average credit' };
    return { level: 'High', description: 'Poor credit' };
  }

  generateRecommendations(score, components) {
    const recommendations = [];

    if (components.paymentHistory.score < 700) {
      recommendations.push({
        category: 'Payment History',
        action: 'Focus on making all payments on time',
        impact: 'High',
        timeframe: '6-12 months'
      });
    }

    if (components.creditUtilization.details.utilizationRatio > 30) {
      recommendations.push({
        category: 'Credit Utilization',
        action: 'Reduce credit utilization below 30%',
        impact: 'High',
        timeframe: '1-3 months'
      });
    }

    if (components.lengthOfHistory.details.accountAgeMonths < 12) {
      recommendations.push({
        category: 'Credit History',
        action: 'Continue building credit history length',
        impact: 'Medium',
        timeframe: '12+ months'
      });
    }

    return recommendations;
  }

  // Helper methods for database queries (implement based on your database)
  async getUserPaymentHistory(userId) {
    // Implement database query
    return [];
  }

  async getUserCreditData(userId) {
    // Implement database query
    return null;
  }

  async getUserAccountAge(userId) {
    // Implement database query
    return 0;
  }

  async getFirstInvoiceDate(userId) {
    // Implement database query
    return null;
  }

  async getUserCreditTypes(userId) {
    // Implement database query
    return {};
  }

  async getRecentCreditInquiries(userId) {
    // Implement database query
    return [];
  }

  async getRecentAccounts(userId) {
    // Implement database query
    return [];
  }
}

module.exports = AdvancedCreditScoring;
