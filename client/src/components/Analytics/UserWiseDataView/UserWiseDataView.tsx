import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Button from '../../ui/Button';
import { User, Clock, TrendingUp, CheckCircle, AlertCircle, Download, Users, BarChart3 } from 'lucide-react';
import api from '../../../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ChartData } from 'chart.js';

interface UserData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assigned: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    autoApproved: number;
  };
  processed: {
    total: number;
    approved: number;
    rejected: number;
  };
  avgResponseTimeHours: number;
  categoryBreakdown: Record<string, number>;
  performance: {
    completionRate: number;
    approvalRate: number;
  };
}

interface UserWiseDataResponse {
  success: boolean;
  data: UserData[];
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalUsers: number;
    totalInspections: number;
    totalProcessed: number;
  };
}

const UserWiseDataView: React.FC = () => {
  const [data, setData] = useState<UserWiseDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    userRole: 'all'
  });

  const fetchUserWiseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.userRole !== 'all' && { userRole: filters.userRole })
      });

      const response = await api.get(`/api/reports/user-wise?${params}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user-wise data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        exportFormat: format,
        ...(filters.userRole !== 'all' && { userRole: filters.userRole })
      });

      const response = await api.get(`/api/reports/user-wise?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-wise-report-${filters.startDate}-to-${filters.endDate}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchUserWiseData();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchUserWiseData();
  };

  // Generate chart data for user performance overview
  const userPerformanceData: ChartData<'bar'> = {
    labels: data?.data.slice(0, 10).map(u => u.user.name.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Assigned',
        data: data?.data.slice(0, 10).map(u => u.assigned.total) || [],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
      },
      {
        label: 'Processed',
        data: data?.data.slice(0, 10).map(u => u.processed.total) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      }
    ],
  };

  // Generate role distribution data
  const roleDistribution = data?.data.reduce((acc, userData) => {
    acc[userData.user.role] = (acc[userData.user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const roleDistributionData: ChartData<'doughnut'> = {
    labels: Object.keys(roleDistribution),
    datasets: [
      {
        data: Object.values(roleDistribution),
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user-wise data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchUserWiseData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User-wise Data Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Role
              </label>
              <Select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'inspector', label: 'Inspector' },
                  { value: 'approver', label: 'Approver' },
                  { value: 'admin', label: 'Admin' }
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalInspections}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Processed</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalProcessed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processing Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.totalInspections > 0 
                      ? Math.round((data.summary.totalProcessed / data.summary.totalInspections) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Users - Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar
                  data={userPerformanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut
                  data={roleDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              variant="outline"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              variant="outline"
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Details Table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((userData) => (
                    <tr key={userData.user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userData.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {userData.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userData.user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          userData.user.role === 'approver' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {userData.user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Total: {userData.assigned.total}</div>
                          <div className="text-xs text-gray-500">
                            Pending: {userData.assigned.pending} | 
                            Approved: {userData.assigned.approved} | 
                            Rejected: {userData.assigned.rejected}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Total: {userData.processed.total}</div>
                          <div className="text-xs text-gray-500">
                            Approved: {userData.processed.approved} | 
                            Rejected: {userData.processed.rejected}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.performance.completionRate}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${userData.performance.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          {userData.avgResponseTimeHours.toFixed(1)}h
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserWiseDataView;
