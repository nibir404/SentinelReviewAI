import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port: number;
  uptime: string;
  version: string;
}

interface ConfigSetting {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
}

interface WebhookConfig {
  id: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  url: string;
  events: string[];
  active: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'reviewer' | 'viewer';
  status: 'active' | 'inactive';
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data
    setTimeout(() => {
      setServices([
        { name: 'API Gateway', status: 'running', port: 3000, uptime: '5d 12h', version: '1.0.0' },
        { name: 'Git Integration', status: 'running', port: 3001, uptime: '5d 12h', version: '1.0.0' },
        { name: 'AI Review Engine', status: 'running', port: 3002, uptime: '5d 12h', version: '1.0.0' },
        { name: 'Context Engine', status: 'running', port: 3003, uptime: '5d 12h', version: '1.0.0' },
        { name: 'Webhook Handler', status: 'running', port: 3004, uptime: '5d 12h', version: '1.0.0' }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const configSettings: ConfigSetting[] = [
    { key: 'MAX_FILE_SIZE', value: '1048576', type: 'number', description: 'Maximum file size in bytes' },
    { key: 'AI_MODEL', value: 'gpt-4', type: 'string', description: 'AI model to use for reviews' },
    { key: 'AUTO_APPROVE_THRESHOLD', value: '90', type: 'number', description: 'Minimum score for auto-approve' },
    { key: 'ENABLE_SECURITY_SCAN', value: 'true', type: 'boolean', description: 'Enable security vulnerability scanning' },
    { key: 'ENABLE_PERFORMANCE_SCAN', value: 'true', type: 'boolean', description: 'Enable performance analysis' },
    { key: 'MAX_CONCURRENT_REVIEWS', value: '10', type: 'number', description: 'Maximum concurrent review processes' },
    { key: 'REVIEW_TIMEOUT', value: '300', type: 'number', description: 'Review timeout in seconds' },
    { key: 'LOG_LEVEL', value: 'info', type: 'string', description: 'Logging level' }
  ];

  const webhooks: WebhookConfig[] = [
    { id: 'wh-001', provider: 'github', url: 'https://sentinel.example.com/webhooks/github', events: ['pull_request', 'push'], active: true },
    { id: 'wh-002', provider: 'gitlab', url: 'https://sentinel.example.com/webhooks/gitlab', events: ['merge_request', 'push'], active: true },
    { id: 'wh-003', provider: 'bitbucket', url: 'https://sentinel.example.com/webhooks/bitbucket', events: ['pullrequest'], active: false }
  ];

  const users: User[] = [
    { id: 'u-001', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: 'u-002', name: 'John Reviewer', email: 'john@example.com', role: 'reviewer', status: 'active' },
    { id: 'u-003', name: 'Jane Viewer', email: 'jane@example.com', role: 'viewer', status: 'active' },
    { id: 'u-004', name: 'Bob Inactive', email: 'bob@example.com', role: 'reviewer', status: 'inactive' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'reviewer': return 'warning';
      case 'viewer': return 'primary';
      default: return 'primary';
    }
  };

  const tabs = [
    { id: 'services', label: 'Services' },
    { id: 'config', label: 'Configuration' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'users', label: 'Users' },
    { id: 'logs', label: 'Logs' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <Button variant="primary">System Settings</Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map(service => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500">Port: {service.port}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{service.uptime}</span> uptime
                        </div>
                        <div className="text-sm text-gray-500">v{service.version}</div>
                        <Button variant="outline" size="sm">Restart</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Total Uptime</div>
                <div className="text-2xl font-bold">99.9%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Avg Response Time</div>
                <div className="text-2xl font-bold">45ms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-gray-500">Active Requests</div>
                <div className="text-2xl font-bold">127</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configSettings.map(setting => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium font-mono">{setting.key}</div>
                    <div className="text-sm text-gray-500">{setting.description}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      type={setting.type === 'boolean' ? 'checkbox' : setting.type === 'number' ? 'number' : 'text'}
                      value={setting.value}
                      className="w-48"
                    />
                    <Button variant="outline" size="sm">Save</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Webhook Endpoints</CardTitle>
                <Button variant="primary">Add Webhook</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map(webhook => (
                  <div key={webhook.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${webhook.active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <div>
                        <div className="font-medium capitalize">{webhook.provider}</div>
                        <div className="text-sm text-gray-500 font-mono">{webhook.url}</div>
                        <div className="flex gap-2 mt-2">
                          {webhook.events.map(event => (
                            <Badge key={event} variant="outline" size="sm">{event}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Test</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="danger" size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <Button variant="primary">Add User</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                      <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>System Logs</CardTitle>
              <div className="flex gap-2">
                <Select className="w-32">
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </Select>
                <Button variant="outline">Download Logs</Button>
                <Button variant="outline">Clear Logs</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
              <div className="text-green-400">[2024-06-15 10:30:45] INFO: API Gateway started on port 3000</div>
              <div className="text-green-400">[2024-06-15 10:30:46] INFO: Git Integration service started on port 3001</div>
              <div className="text-green-400">[2024-06-15 10:30:47] INFO: AI Review Engine started on port 3002</div>
              <div className="text-green-400">[2024-06-15 10:30:48] INFO: Context Engine started on port 3003</div>
              <div className="text-blue-400">[2024-06-15 10:31:00] DEBUG: Processing webhook event from GitHub</div>
              <div className="text-blue-400">[2024-06-15 10:31:01] DEBUG: Parsing pull request #142</div>
              <div className="text-blue-400">[2024-06-15 10:31:02] DEBUG: Analyzing 5 files</div>
              <div className="text-yellow-400">[2024-06-15 10:31:05] WARN: High complexity detected in src/auth/Login.tsx</div>
              <div className="text-red-400">[2024-06-15 10:31:06] ERROR: Security issue found at line 45 - XSS vulnerability</div>
              <div className="text-blue-400">[2024-06-15 10:31:10] DEBUG: Review completed in 8.2s</div>
              <div className="text-green-400">[2024-06-15 10:31:11] INFO: Review result posted to PR #142</div>
              <div className="text-blue-400">[2024-06-15 10:32:00] DEBUG: Processing webhook event from GitLab</div>
              <div className="text-blue-400">[2024-06-15 10:32:01] DEBUG: Parsing merge request !89</div>
              <div className="text-green-400">[2024-06-15 10:32:15] INFO: Review completed in 13.5s</div>
              <div className="text-green-400">[2024-06-15 10:32:16] INFO: Review result posted to MR !89</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPanel;
