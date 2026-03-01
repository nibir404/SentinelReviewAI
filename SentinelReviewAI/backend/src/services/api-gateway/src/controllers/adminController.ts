import { Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware/auth';
import { logger } from '../../../common/utils/logger';
import { AdminService } from '../../admin/src/services/adminService';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../common/utils/errors';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  // ==================== Organizations ====================

  async getOrganizations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20' } = req.query;
      
      const result = await this.adminService.getOrganizations({
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result.organizations,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting organizations:', error);
      throw error;
    }
  }

  async createOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, plan, settings } = req.body;

      if (!name) {
        throw new BadRequestError('Organization name is required');
      }

      const organization = await this.adminService.createOrganization({
        name,
        plan: plan || 'free',
        settings
      });

      res.status(201).json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  async updateOrganization(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orgId } = req.params;
      const updates = req.body;

      const organization = await this.adminService.updateOrganization(orgId, updates);

      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  // ==================== Repositories ====================

  async getRepositories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { page = '1', limit = '20', provider } = req.query;

      const result = await this.adminService.getRepositories(organizationId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        provider: provider as string
      });

      res.json({
        success: true,
        data: result.repositories,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting repositories:', error);
      throw error;
    }
  }

  async addRepository(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { provider, repoUrl, name, settings } = req.body;

      if (!provider || !repoUrl) {
        throw new BadRequestError('Provider and repoUrl are required');
      }

      const repository = await this.adminService.addRepository(organizationId, {
        provider,
        repoUrl,
        name,
        settings
      });

      res.status(201).json({
        success: true,
        data: repository
      });
    } catch (error) {
      logger.error('Error adding repository:', error);
      throw error;
    }
  }

  async deleteRepository(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { repoId } = req.params;
      const organizationId = req.user!.organizationId;

      await this.adminService.deleteRepository(repoId, organizationId);

      res.json({
        success: true,
        message: 'Repository deleted'
      });
    } catch (error) {
      logger.error('Error deleting repository:', error);
      throw error;
    }
  }

  // ==================== Users ====================

  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { page = '1', limit = '20', role } = req.query;

      const result = await this.adminService.getUsers(organizationId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { email, name, role, permissions } = req.body;

      if (!email || !name) {
        throw new BadRequestError('Email and name are required');
      }

      const user = await this.adminService.createUser(organizationId, {
        email,
        name,
        role: role || 'viewer',
        permissions: permissions || []
      });

      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const organizationId = req.user!.organizationId;
      const updates = req.body;

      const user = await this.adminService.updateUser(userId, organizationId, updates);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const organizationId = req.user!.organizationId;

      await this.adminService.deleteUser(userId, organizationId);

      res.json({
        success: true,
        message: 'User deleted'
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== Policies ====================

  async getPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const policies = await this.adminService.getPolicies(organizationId);

      res.json({
        success: true,
        data: policies
      });
    } catch (error) {
      logger.error('Error getting policies:', error);
      throw error;
    }
  }

  async createPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { name, rules, enabled } = req.body;

      if (!name || !rules) {
        throw new BadRequestError('Name and rules are required');
      }

      const policy = await this.adminService.createPolicy(organizationId, {
        name,
        rules,
        enabled: enabled !== false
      });

      res.status(201).json({
        success: true,
        data: policy
      });
    } catch (error) {
      logger.error('Error creating policy:', error);
      throw error;
    }
  }

  async updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      const organizationId = req.user!.organizationId;
      const updates = req.body;

      const policy = await this.adminService.updatePolicy(policyId, organizationId, updates);

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      logger.error('Error updating policy:', error);
      throw error;
    }
  }

  async deletePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { policyId } = req.params;
      const organizationId = req.user!.organizationId;

      await this.adminService.deletePolicy(policyId, organizationId);

      res.json({
        success: true,
        message: 'Policy deleted'
      });
    } catch (error) {
      logger.error('Error deleting policy:', error);
      throw error;
    }
  }

  // ==================== Settings ====================

  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const settings = await this.adminService.getSettings(organizationId);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error getting settings:', error);
      throw error;
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const settings = req.body;

      const updatedSettings = await this.adminService.updateSettings(organizationId, settings);

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  }

  // ==================== Webhooks ====================

  async getWebhooks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const webhooks = await this.adminService.getWebhooks(organizationId);

      res.json({
        success: true,
        data: webhooks
      });
    } catch (error) {
      logger.error('Error getting webhooks:', error);
      throw error;
    }
  }

  async createWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { url, events, secret, enabled } = req.body;

      if (!url || !events || events.length === 0) {
        throw new BadRequestError('URL and events are required');
      }

      const webhook = await this.adminService.createWebhook(organizationId, {
        url,
        events,
        secret,
        enabled: enabled !== false
      });

      res.status(201).json({
        success: true,
        data: webhook
      });
    } catch (error) {
      logger.error('Error creating webhook:', error);
      throw error;
    }
  }

  async deleteWebhook(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { webhookId } = req.params;
      const organizationId = req.user!.organizationId;

      await this.adminService.deleteWebhook(webhookId, organizationId);

      res.json({
        success: true,
        message: 'Webhook deleted'
      });
    } catch (error) {
      logger.error('Error deleting webhook:', error);
      throw error;
    }
  }

  // ==================== Audit Logs ====================

  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { page = '1', limit = '50', action, userId, startDate, endDate } = req.query;

      const result = await this.adminService.getAuditLogs(organizationId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        action: action as string,
        userId: userId as string,
        startDate: startDate as string,
        endDate: endDate as string
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // ==================== API Keys ====================

  async getAPIKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const keys = await this.adminService.getAPIKeys(organizationId);

      res.json({
        success: true,
        data: keys
      });
    } catch (error) {
      logger.error('Error getting API keys:', error);
      throw error;
    }
  }

  async createAPIKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const { name, permissions, expiresAt } = req.body;

      if (!name) {
        throw new BadRequestError('API key name is required');
      }

      const apiKey = await this.adminService.createAPIKey(organizationId, {
        name,
        permissions: permissions || ['read'],
        expiresAt
      });

      res.status(201).json({
        success: true,
        data: apiKey
      });
    } catch (error) {
      logger.error('Error creating API key:', error);
      throw error;
    }
  }

  async deleteAPIKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const organizationId = req.user!.organizationId;

      await this.adminService.deleteAPIKey(keyId, organizationId);

      res.json({
        success: true,
        message: 'API key deleted'
      });
    } catch (error) {
      logger.error('Error deleting API key:', error);
      throw error;
    }
  }

  // ==================== Models ====================

  async getModels(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;

      const models = await this.adminService.getModels(organizationId);

      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Error getting models:', error);
      throw error;
    }
  }

  async updateModel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { modelId } = req.params;
      const organizationId = req.user!.organizationId;
      const updates = req.body;

      const model = await this.adminService.updateModel(modelId, organizationId, updates);

      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      logger.error('Error updating model:', error);
      throw error;
    }
  }
}
