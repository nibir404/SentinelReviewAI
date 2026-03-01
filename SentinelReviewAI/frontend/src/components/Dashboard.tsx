import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface DashboardStats {
  totalPRs: number;
  reviewedPRs: number;
  pendingPRs: number;
  avgReviewTime: number;
  issuesFound: number;
  criticalIssues: number;
}

interface ReviewTrend {
  date: string;
  reviewed: number;
  issues: number;
}

interface RepositoryStats {
  name: string;
  prs: number;
  issues: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPRs: 0,
    reviewedPRs: 0,
    pendingPRs: 0,
    avgReviewTime: 0,
    issuesFound: 0,
    criticalIssues: 0
  });
  const [trends, setTrends] = useState<ReviewTrend[]>([]);
  const [repositories, setRepositories] = useState<RepositoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated data - replace with actual API calls
    setTimeout(() => {
      setStats({
        totalPRs: 156,
        reviewedPRs: 142,
        pendingPRs: 14,
        avgReviewTime: 4.2,
        issuesFound: 89,
        criticalIssues: 12
      });
      setTrends([
        { date: '2024-01', reviewed: 45, issues: 12 },
        { date: '2024-02', reviewed: 52, issues: 18 },
        { date: '2024-03', reviewed: 48, issues: 15 },
        { date: '2024-04', reviewed: 61, issues: 22 },
        { date: '2024-05', reviewed: 55, issues: 19 },
        { date: '2024-06', reviewed: 67, issues: 25 }
      ]);
      setRepositories([
        { name: 'frontend', prs: 45, issues: 28 },
        { name: 'backend', prs: 38, issues: 22 },
        { name: 'mobile', prs: 32, issues: 18 },
        { name: 'infrastructure', prs: 27, issues: 21 }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const issueDistribution = [
    { name: 'Security', value: 12 },
    { name: 'Performance', value: 18 },
    { name: 'Code Quality', value: 35 },
    { name: 'Best Practices', value: 24 }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button>Refresh Data</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Total PRs</div>
            <div className="text-2xl font-bold">{stats.totalPRs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Reviewed</div>
            <div className="text-2xl font-bold text-green-600">{stats.reviewedPRs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPRs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Avg Review Time</div>
            <div className="text-2xl font-bold">{stats.avgReviewTime}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Issues Found</div>
            <div className="text-2xl font-bold">{stats.issuesFound}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Critical Issues</div>
            <div className="text-2xl font-bold text-red-600">{stats.criticalIssues}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Review Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reviewed" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="issues" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Repository Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={repositories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="prs" fill="#3B82F6" name="Pull Requests" />
              <Bar dataKey="issues" fill="#EF4444" name="Issues" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, pr: '#142', repo: 'frontend', status: 'approved', time: '5 min ago' },
              { id: 2, pr: '#89', repo: 'backend', status: 'changes_requested', time: '15 min ago' },
              { id: 3, pr: '#256', repo: 'mobile', status: 'pending', time: '30 min ago' },
              { id: 4, pr: '#178', repo: 'infrastructure', status: 'approved', time: '1 hour ago' }
            ].map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{activity.pr}</span>
                  <span className="text-gray-500">{activity.repo}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={activity.status === 'approved' ? 'success' : activity.status === 'changes_requested' ? 'danger' : 'warning'}>
                    {activity.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
