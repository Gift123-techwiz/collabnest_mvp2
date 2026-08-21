const userRepository = require('../repositories/userRepository');
const AppDataSource = require('../config/database');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  signAccessToken,
  generateRefreshTokenValue,
  hashRefreshToken,
  getRefreshExpiryDate,
} = require('../utils/jwt');
const { calculateAge } = require('../utils/age');

const refreshTokenRepo = () => AppDataSource.getRepository('RefreshToken');

function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  // age is always derived from dateOfBirth, never stored — see utils/age.js
  return { ...safe, age: calculateAge(safe.dateOfBirth) };
}

async function issueTokenPair(user, rememberMe) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshTokenValue = generateRefreshTokenValue();

  await refreshTokenRepo().save(
    refreshTokenRepo().create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshTokenValue),
      rememberMe: !!rememberMe,
      expiresAt: getRefreshExpiryDate(rememberMe),
    })
  );

  return { accessToken, refreshToken: refreshTokenValue };
}

async function register({ fullName, email, password, dateOfBirth }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await userRepository.findByEmail(normalizedEmail);
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    dateOfBirth,
  });

  const tokens = await issueTokenPair(user, false);
  return { user: sanitizeUser(user), ...tokens };
}

async function login({ email, password, rememberMe }) {
  const user = await userRepository.findByEmail(email);
  if (!user) throw AppError.unauthorized('Invalid email or password');

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Invalid email or password');

  const tokens = await issueTokenPair(user, rememberMe);
  return { user: sanitizeUser(user), ...tokens };
}

async function refresh({ refreshToken }) {
  const tokenHash = hashRefreshToken(refreshToken);
  const record = await refreshTokenRepo().findOne({ where: { tokenHash } });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw AppError.unauthorized('Refresh token is invalid, expired, or revoked');
  }

  // Rotate: revoke the old token, issue a new pair.
  record.revokedAt = new Date();
  await refreshTokenRepo().save(record);

  const user = await userRepository.findById(record.userId);
  if (!user) throw AppError.unauthorized('User no longer exists');

  return issueTokenPair(user, record.rememberMe);
}

async function logout({ refreshToken }) {
  if (!refreshToken) return;
  const tokenHash = hashRefreshToken(refreshToken);
  await refreshTokenRepo().update({ tokenHash }, { revokedAt: new Date() });
}

module.exports = { register, login, refresh, logout, sanitizeUser };
