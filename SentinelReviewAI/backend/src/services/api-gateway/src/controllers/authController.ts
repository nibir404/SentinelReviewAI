import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../common/db/prisma';
import { logger } from '../../../common/utils/logger';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../../common/utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, organizationName } = req.body;

      if (!email || !password || !name) {
        throw new BadRequestError('Email, password, and name are required');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create organization if provided, otherwise use default
      let organizationId: string;
      
      if (organizationName) {
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        const existingOrg = await prisma.organization.findUnique({
          where: { slug }
        });

        if (existingOrg) {
          organizationId = existingOrg.id;
        } else {
          const org = await prisma.organization.create({
            data: {
              name: organizationName,
              slug
            }
          });
          organizationId = org.id;
        }
      } else {
        // Create default organization
        const org = await prisma.organization.create({
          data: {
            name: 'My Organization',
            slug: `org-${Date.now()}`
          }
        });
        organizationId = org.id;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword
        }
      });

      // Link user to organization
      await prisma.organizationUser.create({
        data: {
          userId: user.id,
          organizationId,
          role: 'ADMIN'
        }
      });

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          organizationId,
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          },
          organization: {
            id: organizationId
          },
          token
        }
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Get user's organization
      const orgUser = await prisma.organizationUser.findFirst({
        where: { userId: user.id },
        include: { organization: true }
      });

      if (!orgUser) {
        throw new UnauthorizedError('User not associated with any organization');
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          organizationId: orgUser.organizationId,
          role: orgUser.role.toLowerCase(),
          permissions: this.getPermissions(orgUser.role)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          },
          organization: {
            id: orgUser.organizationId,
            name: orgUser.organization.name,
            slug: orgUser.organization.slug
          },
          token
        }
      });
    } catch (error) {
      logger.error(`Login error: ${error}`);
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const orgUser = await prisma.organizationUser.findFirst({
        where: { userId: user.id },
        include: { organization: true }
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          },
          organization: orgUser ? {
            id: orgUser.organizationId,
            name: orgUser.organization.name,
            slug: orgUser.organization.slug
          } : null
        }
      });
    } catch (error) {
      logger.error(`Get current user error: ${error}`);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Generate new token
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          organizationId: decoded.organizationId,
          role: decoded.role,
          permissions: decoded.permissions
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (error) {
      logger.error(`Refresh token error: ${error}`);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    // In a real app, you might want to invalidate the token
    // For now, we just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Current and new password are required');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.password) {
        throw new NotFoundError('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error(`Change password error: ${error}`);
      throw error;
    }
  }

  private getPermissions(role: string): string[] {
    switch (role) {
      case 'ADMIN':
        return ['read', 'write', 'delete', 'admin'];
      case 'DEVELOPER':
        return ['read', 'write'];
      case 'VIEWER':
        return ['read'];
      default:
        return ['read'];
    }
  }
}