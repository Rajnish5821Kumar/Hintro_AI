/**
 * Auth Service
 * Handles user registration, login, password hashing, and JWT generation.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { userRepository } from '../repositories/userRepository';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export class AuthService {
  private readonly log = createLogger();

  /**
   * Register a new user.
   * Throws ConflictError if email already exists.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    this.log.info('Registering new user', { email: input.email });

    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    const token = this.generateToken(user);
    const { passwordHash: _, ...userWithoutPassword } = user;

    this.log.info('User registered successfully', { userId: user.id });

    return { user: userWithoutPassword, token };
  }

  /**
   * Authenticate an existing user.
   * Throws UnauthorizedError on invalid credentials.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    this.log.info('Login attempt', { email: input.email });

    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      // Use same error message for both cases to prevent email enumeration
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      this.log.warn('Failed login attempt', { email: input.email });
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user);
    const { passwordHash: _, ...userWithoutPassword } = user;

    this.log.info('User logged in successfully', { userId: user.id });

    return { user: userWithoutPassword, token };
  }

  /**
   * Generate a signed JWT for the given user.
   */
  private generateToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
  }
}

export const authService = new AuthService();
