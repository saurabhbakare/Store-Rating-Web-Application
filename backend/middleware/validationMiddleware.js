// Helper validation functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  if (!password || password.length < 8 || password.length > 16) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  // Special characters can be defined as any character that is not alphanumeric or whitespace
  const hasSpecial = /[^A-Za-z0-9\s]/.test(password);
  return hasUppercase && hasSpecial;
}

function isValidName(name) {
  return name && name.trim().length >= 20 && name.trim().length <= 60;
}

function isValidAddress(address) {
  return address && address.trim().length > 0 && address.trim().length <= 400;
}

// Middleware exports
function validateSignup(req, res, next) {
  const { name, email, password, address } = req.body;
  const errors = {};

  if (!isValidName(name)) {
    errors.name = 'Name must be between 20 and 60 characters.';
  }
  if (!email || !isValidEmail(email)) {
    errors.email = 'Email must follow standard email validation rules.';
  }
  if (!isValidPassword(password)) {
    errors.password = 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.';
  }
  if (!isValidAddress(address)) {
    errors.address = 'Address is required and must not exceed 400 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

function validateUserCreation(req, res, next) {
  const { name, email, password, address, role } = req.body;
  const errors = {};

  if (!isValidName(name)) {
    errors.name = 'Name must be between 20 and 60 characters.';
  }
  if (!email || !isValidEmail(email)) {
    errors.email = 'Email must follow standard email validation rules.';
  }
  if (!isValidPassword(password)) {
    errors.password = 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.';
  }
  if (!isValidAddress(address)) {
    errors.address = 'Address is required and must not exceed 400 characters.';
  }
  if (!role || !['admin', 'user', 'store_owner'].includes(role)) {
    errors.role = 'Role is required and must be admin, user, or store_owner.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

function validateStoreCreation(req, res, next) {
  const { name, email, address, ownerName, ownerEmail, ownerPassword, ownerAddress } = req.body;
  const errors = {};

  // Validate Store details
  if (!isValidName(name)) {
    errors.name = 'Store Name must be between 20 and 60 characters.';
  }
  if (!email || !isValidEmail(email)) {
    errors.email = 'Store Email must follow standard email validation rules.';
  }
  if (!isValidAddress(address)) {
    errors.address = 'Store Address is required and must not exceed 400 characters.';
  }

  // Validate Owner details
  if (!isValidName(ownerName)) {
    errors.ownerName = 'Owner Name must be between 20 and 60 characters.';
  }
  if (!ownerEmail || !isValidEmail(ownerEmail)) {
    errors.ownerEmail = 'Owner Email must follow standard email validation rules.';
  }
  if (!isValidPassword(ownerPassword)) {
    errors.ownerPassword = 'Owner Password must be 8-16 characters and contain at least one uppercase letter and one special character.';
  }
  if (!isValidAddress(ownerAddress)) {
    errors.ownerAddress = 'Owner Address is required and must not exceed 400 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

function validatePasswordUpdate(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required.';
  }
  if (!isValidPassword(newPassword)) {
    errors.newPassword = 'New password must be 8-16 characters and contain at least one uppercase letter and one special character.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  next();
}

module.exports = {
  validateSignup,
  validateUserCreation,
  validateStoreCreation,
  validatePasswordUpdate,
};
