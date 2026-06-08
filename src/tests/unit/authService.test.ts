/**
 * Unit Tests — Auth Service
 */

import { AuthService } from '../../services/authService';
import { userRepository } from '../../repositories/userRepository';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import bcrypt from 'bcryptjs';

// ── Mock Dependencies ─────────────────────────────────────────
jest.mock('../../repositories/userRepository');
jest.mock('bcryptjs');

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32chars';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.BCRYPT_SALT_ROUNDS = '10';
  });

  // ── Register Tests ────────────────────────────────────────────
  describe('register', () => {
    const registerInput = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePass123',
    };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should register a new user and return token', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await authService.register(registerInput);

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(registerInput.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictError if email already exists', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
    });

    it('should hash the password before storing', async () => {
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser);

      await authService.register(registerInput);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerInput.password, expect.any(Number));
    });
  });

  // ── Login Tests ───────────────────────────────────────────────
  describe('login', () => {
    const loginInput = { email: 'test@example.com', password: 'SecurePass123' };

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login successfully and return token', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginInput);

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(loginInput.email);
    });

    it('should throw UnauthorizedError for non-existent email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
    });

    it('should not reveal whether email exists (same error message)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      let errorMessage1 = '';
      try {
        await authService.login({ email: 'nonexistent@example.com', password: 'wrong' });
      } catch (err) {
        errorMessage1 = (err as Error).message;
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      let errorMessage2 = '';
      try {
        await authService.login({ email: 'test@example.com', password: 'wrong' });
      } catch (err) {
        errorMessage2 = (err as Error).message;
      }

      // Both should have the same error message to prevent email enumeration
      expect(errorMessage1).toBe(errorMessage2);
    });
  });
});
