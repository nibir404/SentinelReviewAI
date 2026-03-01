import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Select } from './ui/Select';

interface TimeSeriesData {
  date: string;
  prs: number;
  reviews: number;
  issues: number;
}

interface RepositoryData {
  name: string;
  prs: number;
  reviews: number;
  avgTime: number;
}

interface DeveloperData {
  name: string;
  prsReviewed: number;
  issuesFound: number;
  avgScore: number;
}

interface IssueBreakdown {
  category: string;
  count: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, [timeRange]);

  // Mock data
  const timeSeriesData: TimeSeriesData[] = [
    { date: '2024-06-01', prs: 12, reviews: 10, issues: 5 },
    { date: '2024-06-05', prs: 18, reviews: 15, issues: 8 },
    { date: '2024-06-10', prs: 15, reviews: 14, issues: 6 },
    { date: '2024-06-15', prs: 22, reviews: 20, issues: 12 },
    { date: '2024-06-20', prs: 19, reviews: 17, issues: 9 },
    { date: '2024-06-25', prs: 25, reviews: 22, issues: 14 },
    { date: '2024-06-30', prs: 21, reviews: 19, issues: 11 }
  ];

  const repositoryData: RepositoryData[] = [
    { name: 'frontend', prs: 45, reviews: 42, avgTime: 3.5 },
    { name: 'backend', prs: 38, reviews: 35, avgTime: 4.2 },
    { name: 'mobile', prs: 28, reviews: 26, avgTime: 5.1 },
    { name: 'infrastructure', prs: 22, reviews: 20, avgTime: 2.8 },
    { name: 'docs', prs: 15, reviews: 15, avgTime: 1.2 }
  ];

  const developerData: DeveloperData[] = [
    { name: 'John Doe', prsReviewed: 45, issuesFound: 28, avgScore: 82 },
    { name: 'Jane Smith', prsReviewed: 38, issuesFound: 35, avgScore: 78 },
    { name: 'Bob Wilson', prsReviewed: 32, issuesFound: 22, avgScore: 85 },
    { name: 'Alice Brown', prsReviewed: 28, issuesFound: 18, avgScore: 91 },
    { name: 'Charlie Day', prsReviewed: 25, issuesFound: 15, avgScore: 88 }
  ];

  const issueBreakdown: IssueBreakdown[] = [
    { category: 'Security', count: 15 },
    { category: 'Performance', count: 28 },
    { category: 'Code Quality', count: 45 },
    { category: 'Best Practices', count: 32 },
    { category: 'Error Handling', count: 22 },
    { category: 'Testing', count: 18 }
  ];

  const gradeDistribution = [
    { grade: 'A', count: 45, percentage: 35 },
    { grade: 'B', count: 38, percentage: 29 },
    { grade: 'C', count: 28, percentage: 22 },
    { grade: 'D', count: 12, percentage: 9 },
    { grade: 'F', count: 7, percentage: 5 }
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="w-40"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Total PRs Reviewed</div>
            <div className="text-3xl font-bold">1,247</div>
            <div className="text-sm text-green-600 mt-1">↑ 12% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Avg Review Time</div>
            <div className="text-3xl font-bold">4.2m</div>
            <div className="text-sm text-green-600 mt-1">↓ 8% faster</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Issues Detected</div>
            <div className="text-3xl font-bold">342</div>
            <div className="text-sm text-yellow-600 mt-1">↑ 5% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-500">Avg Score</div>
            <div className="text-3xl font-bold">82.5</div>
            <div className="text-sm text-green-600 mt-1">↑ 3 points</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PR Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>PR Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="prs" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="reviews" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues Detected Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Detected Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="issues" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repository Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Repository Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repositoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="prs" fill="#3B82F6" name="PRs" />
                <Bar dataKey="reviews" fill="#10B981" name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {issueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {issueBreakdown.map((item, index) => (
                <div key={item.category} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-sm">{item.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Developer Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {developerData.map((dev, index) => (
                <div key={dev.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{dev.name}</div>
                      <div className="text-sm text-gray-500">{dev.prsReviewed} PRs reviewed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{dev.issuesFound} issues</div>
                    <div className="text-sm text-gray-500">Avg score: {dev.avgScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" name="Count">
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Average Review Time by Repository */}
      <Card>
        <CardHeader>
          <CardTitle>Average Review Time by Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {repositoryData.map(repo => (
              <div key={repo.name} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{repo.avgTime}m</div>
                <div className="text-sm text-gray-500 capitalize">{repo.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
