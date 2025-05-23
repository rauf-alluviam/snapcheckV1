import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, FileText, ChevronDown, ChevronUp, AlertCircle, Loader } from 'lucide-react';
import api from '../../utils/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

const AnalyticsPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    category: 'all',
    inspector: 'all'
  });
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'inspections-over-time': true,
    'inspections-by-category': true,
    'status-distribution': true,
    'inspector-performance': true,
    'completion-time': true
  });
  
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };
    // Generate chart data from analytics
  const inspectionTimeData: ChartData<'line'> = {
    labels: analyticsData?.inspectionsOverTime.map(d => d.month) || [],
    datasets: [
      {
        label: 'Completed',
        data: analyticsData?.inspectionsOverTime.map(d => d.completed) || [],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.2,
      },
      {
        label: 'Rejected',
        data: analyticsData?.inspectionsOverTime.map(d => d.rejected) || [],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.2,
      },
      {
        label: 'Pending',
        data: analyticsData?.inspectionsOverTime.map(d => d.pending) || [],
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.2,
      }
    ],
  };

  const categories = Object.keys(analyticsData?.categoryDistribution || {});
  const categoryData: ChartData<'bar'> = {
    labels: categories,
    datasets: [
      {
        label: 'Inspections by Category',
        data: categories.map(cat => analyticsData?.categoryDistribution[cat] || 0),
        backgroundColor: categories.map((_, i) => [
          'rgba(37, 99, 235, 0.7)',
          'rgba(13, 148, 136, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(156, 163, 175, 0.7)'
        ][i % 4]),
      }
    ],
  };

  const statusData: ChartData<'doughnut'> = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [
          analyticsData?.statusDistribution.pending || 0,
          analyticsData?.statusDistribution.approved || 0,
          analyticsData?.statusDistribution.rejected || 0,
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const inspectorData: ChartData<'bar'> = {
    labels: analyticsData?.inspectorPerformance.map(i => i.name) || [],
    datasets: [
      {
        label: 'Inspections Completed',
        data: analyticsData?.inspectorPerformance.map(i => i.completed) || [],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
      },
      {
        label: 'Approval Rate (%)',
        data: analyticsData?.inspectorPerformance.map(i => i.approvalRate) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      }
    ],
  };

  const categoryCompletionTimes = Object.keys(analyticsData?.completionTimes || {});
  const completionTimeData: ChartData<'bar'> = {
    labels: categoryCompletionTimes,
    datasets: [
      {
        label: 'Average Completion Time (minutes)',
        data: categoryCompletionTimes.map(cat => analyticsData?.completionTimes[cat] || 0),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
      }
    ],
  };
  
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // Add useEffect to fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch analytics data using the API service
        const response = await api.post('/api/reports/analytics', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          ...filters
        });
        
        setAnalyticsData(response.data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.message || 'Failed to load analytics data. Please try again.');
        // Keep using mock data when there's an error
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange.startDate, dateRange.endDate, filters.category, filters.inspector]);
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-6">
              <FileText className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to access analytics. This feature is only available to administrators.
          </p>
          <a href="/dashboard">
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Return to Dashboard
            </button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                Date Range
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Select
                label="Category"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'cargo', label: 'Cargo' },
                  { value: 'facility', label: 'Facility' },
                  { value: 'vehicle', label: 'Vehicle' }
                ]}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
            </div>
            
            <div>
              <Select
                label="Inspector"
                options={[
                  { value: 'all', label: 'All Inspectors' },
                  { value: 'john', label: 'John Doe' },
                  { value: 'michael', label: 'Michael Brown' },
                  { value: 'sarah', label: 'Sarah Johnson' },
                  { value: 'david', label: 'David Wilson' }
                ]}
                value={filters.inspector}
                onChange={(e) => setFilters({ ...filters, inspector: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Loading and Error States */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" 
            // onClick={() => toggleCardExpansion('inspections-over-time')}
            >
              <CardTitle>Inspections Over Time</CardTitle>
              <button className="text-gray-400 hover:text-gray-500">
                {expandedCards['inspections-over-time'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </CardHeader>
            {expandedCards['inspections-over-time'] && (
              <CardContent>
                <Line data={inspectionTimeData} options={chartOptions} />
              </CardContent>
            )}
          </Card>
        
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer" 
              // onClick={() => toggleCardExpansion('inspections-by-category')}
              >
                <CardTitle>Inspections by Category</CardTitle>
                <button className="text-gray-400 hover:text-gray-500">
                  {expandedCards['inspections-by-category'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </CardHeader>
              {expandedCards['inspections-by-category'] && (
                <CardContent>
                  <Bar data={categoryData} options={barOptions} />
                </CardContent>
              )}
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer" 
              // onClick={() => toggleCardExpansion('status-distribution')}
              >
                <CardTitle>Status Distribution</CardTitle>
                <button className="text-gray-400 hover:text-gray-500">
                  {expandedCards['status-distribution'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </CardHeader>
              {expandedCards['status-distribution'] && (
                <CardContent className="flex justify-center">
                  <div style={{ maxWidth: '300px' }}>
                    <Doughnut data={statusData} options={doughnutOptions} />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" 
            // onClick={() => toggleCardExpansion('inspector-performance')}
            >
              <CardTitle>Inspector Performance</CardTitle>
              <button className="text-gray-400 hover:text-gray-500">
                {expandedCards['inspector-performance'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </CardHeader>
            {expandedCards['inspector-performance'] && (
              <CardContent>
                <Bar data={inspectorData} options={barOptions} />
              </CardContent>
            )}
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between cursor-pointer" 
            // onClick={() => toggleCardExpansion('completion-time')}
            >
              <CardTitle>Average Completion Time by Category</CardTitle>
              <button className="text-gray-400 hover:text-gray-500">
                {expandedCards['completion-time'] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </CardHeader>
            {expandedCards['completion-time'] && (
              <CardContent>
                <Bar data={completionTimeData} options={barOptions} />
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;