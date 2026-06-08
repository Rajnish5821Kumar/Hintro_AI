/**
 * User Repository
 * All database operations for the User model are isolated here.
 */

import { User } from '@prisma/client';
import prisma from '../prisma/client';

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

export class UserRepository {
  /**
   * Create a new user.
   */
  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Find user by email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  /**
   * Find user by ID.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  /**
   * Check if a user with the given email already exists.
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
