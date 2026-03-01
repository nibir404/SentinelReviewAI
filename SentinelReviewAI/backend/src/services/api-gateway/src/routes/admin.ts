import { Router, Response } from 'express';
import { AdminController } from '../controllers/adminController';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { requireRole } from '../../../common/middleware/auth';

export const adminRouter = Router();
const adminController = new AdminController();

// Organization management
adminRouter.get('/organizations', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getOrganizations(req, res);
});

adminRouter.post('/organizations', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.createOrganization(req, res);
});

adminRouter.put('/organizations/:orgId', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.updateOrganization(req, res);
});

// Repository management
adminRouter.get('/repositories', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getRepositories(req, res);
});

adminRouter.post('/repositories', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.addRepository(req, res);
});

adminRouter.delete('/repositories/:repoId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.deleteRepository(req, res);
});

// User management
adminRouter.get('/users', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getUsers(req, res);
});

adminRouter.post('/users', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.createUser(req, res);
});

adminRouter.put('/users/:userId', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.updateUser(req, res);
});

adminRouter.delete('/users/:userId', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.deleteUser(req, res);
});

// Policy management
adminRouter.get('/policies', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getPolicies(req, res);
});

adminRouter.post('/policies', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.createPolicy(req, res);
});

adminRouter.put('/policies/:policyId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.updatePolicy(req, res);
});

adminRouter.delete('/policies/:policyId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.deletePolicy(req, res);
});

// Settings
adminRouter.get('/settings', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getSettings(req, res);
});

adminRouter.put('/settings', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.updateSettings(req, res);
});

// Webhook configuration
adminRouter.get('/webhooks', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getWebhooks(req, res);
});

adminRouter.post('/webhooks', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.createWebhook(req, res);
});

adminRouter.delete('/webhooks/:webhookId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.deleteWebhook(req, res);
});

// Audit logs
adminRouter.get('/audit-logs', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getAuditLogs(req, res);
});

// API keys
adminRouter.get('/api-keys', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getAPIKeys(req, res);
});

adminRouter.post('/api-keys', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.createAPIKey(req, res);
});

adminRouter.delete('/api-keys/:keyId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.deleteAPIKey(req, res);
});

// Model configuration
adminRouter.get('/models', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.getModels(req, res);
});

adminRouter.put('/models/:modelId', async (req: AuthenticatedRequest, res: Response) => {
  await adminController.updateModel(req, res);
});
