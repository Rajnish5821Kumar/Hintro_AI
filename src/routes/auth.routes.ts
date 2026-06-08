/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rajnish@example.com
 *               name:
 *                 type: string
 *                 example: Rajnish Kumar
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

export default router;
