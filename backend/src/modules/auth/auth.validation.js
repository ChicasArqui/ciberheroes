function isValidGuardianPassword(password) {
  if (typeof password !== 'string') return false;

  const hasMinimumLength = password.length >= 15;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  return hasMinimumLength &&
    hasUppercase &&
    hasLowercase &&
    hasSymbol;
}

function isValidGuardianEmail(email) {
  if (typeof email !== 'string') return false;

  const normalizedEmail = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
}

module.exports = {
  isValidGuardianPassword,
  isValidGuardianEmail
};