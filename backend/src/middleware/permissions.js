const requireBusinessUser = (req, res, next) => {
  if (req.user.userType !== 'business') {
    return res.status(403).json({ error: 'Business user access required' });
  }
  next();
};

const requireInvestorUser = (req, res, next) => {
  if (req.user.userType !== 'investor') {
    return res.status(403).json({ error: 'Investor user access required' });
  }
  next();
};

const requireAdminUser = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireVerifiedUser = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      error: 'Account verification required',
      message: 'Please complete KYC verification to access this feature'
    });
  }
  next();
};

module.exports = {
  requireBusinessUser,
  requireInvestorUser,
  requireAdminUser,
  requireVerifiedUser
};