import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { Download, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

interface FilterOption {
  id: string;
  label: string;
  type: 'select';
  options: Array<{ value: string; label: string }>;
}

const ReportsPage: React.FC = () => {
  const { state } = useAuth();
  const { user } = state;
  const isAdmin = user?.role === 'admin';
  const isApprover = user?.role === 'approver';
  
  const [selectedReport, setSelectedReport] = useState('inspection-summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  const reportOptions = [
    { value: 'inspection-summary', label: 'Inspection Summary Report', access: ['admin', 'approver'] },
    { value: 'issue-heatmap', label: 'Issue Heatmap Report', access: ['admin'] },
    { value: 'inspector-performance', label: 'Inspector Performance Report', access: ['admin'] },
    { value: 'customer-inspection-log', label: 'Customer Inspection Log', access: ['admin', 'approver'] }
  ].filter(report => report.access.includes(user?.role || ''));
  
  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel' }
  ];

  // Real data for dynamic filter options
  const [inspectors, setInspectors] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [organizations, setOrganizations] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [inspectorsRes, categoriesRes, orgsRes] = await Promise.all([
          api.get('/api/users?role=inspector'),
          api.get('/api/workflows/categories'),
          api.get('/api/organizations')
        ]);

        setInspectors([
          { value: 'all', label: 'All Inspectors' },
          ...inspectorsRes.data.map((i: any) => ({ value: i._id, label: i.name }))
        ]);

        setCategories([
          { value: 'all', label: 'All Categories' },
          ...categoriesRes.data.map((c: string) => ({ value: c.toLowerCase(), label: c }))
        ]);

        setOrganizations(
          orgsRes.data.map((org: any) => ({ value: org._id, label: org.name }))
        );
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  const getFilterOptions = (): FilterOption[] => {
    switch (selectedReport) {
      case 'inspection-summary':
        return [
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            options: categories
          },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]
          }
        ];

      case 'issue-heatmap':
        return [
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            options: categories
          }
        ];

      case 'inspector-performance':
        return [
          {
            id: 'inspector',
            label: 'Inspector',
            type: 'select',
            options: inspectors
          }
        ];

      case 'customer-inspection-log':
        return [
          {
            id: 'organizationId',
            label: 'Organization',
            type: 'select',
            options: organizations
          },
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            options: categories
          }
        ];

      default:
        return [];
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await api.post(`/api/reports/${selectedReport}`, {
        ...dateRange,
        ...filters,
        format,
        organizationId: user?.organizationId
      }, {
        responseType: format === 'pdf' ? 'blob' : 'json'
      });

      // Handle different format types
      if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (format === 'csv' || format === 'excel') {
        const fileName = `${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
        const blob = new Blob([response.data], { 
          type: format === 'csv' 
            ? 'text/csv' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }    } catch (err: any) {
      console.error('Error generating report:', err);
      const errorResponse = err.response?.data?.error;
      
      if (errorResponse) {
        setError(
          `${errorResponse.message}${errorResponse.details ? '\n' + 
          (Array.isArray(errorResponse.details) 
            ? errorResponse.details.join('\n') 
            : errorResponse.details)
          : ''}`
        );
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                setFilters({});
              }}
              options={reportOptions}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <Select
              label="Format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              options={formatOptions}
            />
          </div>

          {getFilterOptions().length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilterOptions().map((filter) => (
                  <Select
                    key={filter.id}
                    label={filter.label}
                    value={filters[filter.id] || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, [filter.id]: e.target.value }))}
                    options={filter.options}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;