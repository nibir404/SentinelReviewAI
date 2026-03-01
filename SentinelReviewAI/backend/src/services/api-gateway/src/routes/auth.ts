import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/authController';

export const authRouter = Router();
const authController = new AuthController();

// User registration
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  await authController.register(req, res);
});

// User login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  await authController.login(req, res);
});

// Get current user
authRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  await authController.getCurrentUser(req, res);
});

// Refresh token
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  await authController.refreshToken(req, res);
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  await authController.logout(req, res);
});

// Change password
authRouter.post('/change-password', async (req: Request, res: Response, next: NextFunction) => {
  await authController.changePassword(req, res);
});