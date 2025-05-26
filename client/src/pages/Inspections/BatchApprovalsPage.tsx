import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import TextArea from '../../components/ui/TextArea';
import api from '../../utils/api';

interface BatchItem {
  _id: string;
  workflowId: string;
  workflowName: string;
  category: string;
  count: number;
  firstCreatedAt: string;
  lastCreatedAt: string;
}

interface BatchDetails {
  batchId: string;
  inspections: {
    _id: string;
    status: string;
    assignedTo: { _id: string; name: string };
    assignedToName: string;
    inspectionDate: string;
    meterReading?: number;
    readingDate?: string;
    createdAt: string;
  }[];
  count: number;
  firstCreatedAt: string;
  lastCreatedAt: string;
}

const BatchApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;
  
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchDetails | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all batches on load
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/inspections/batch');
        setBatches(response.data);
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Failed to load inspection batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // Load batch details when a batch is selected
  const handleBatchSelect = async (batchId: string) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/api/inspections/batch/${batchId}`);
      setSelectedBatch(response.data);
      setDetailLoading(false);
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError('Failed to load batch details');
      setDetailLoading(false);
    }
  };

  const handleApproveAll = async () => {
    if (!selectedBatch) return;
    
    try {
      await api.put(`/api/inspections/batch/${selectedBatch.batchId}/approve`, { remarks });
      // Successfully approved, refresh the list
      setBatches(batches.filter(b => b._id !== selectedBatch.batchId));
      setSelectedBatch(null);
      setShowApproveModal(false);
      setRemarks('');
    } catch (err) {
      console.error('Error approving batch:', err);
      setError('Failed to approve batch');
    }
  };

  const handleRejectAll = async () => {
    if (!selectedBatch || !remarks.trim()) return;
    
    try {
      await api.put(`/api/inspections/batch/${selectedBatch.batchId}/reject`, { remarks });
      // Successfully rejected, refresh the list
      setBatches(batches.filter(b => b._id !== selectedBatch.batchId));
      setSelectedBatch(null);
      setShowRejectModal(false);
      setRemarks('');
    } catch (err) {
      console.error('Error rejecting batch:', err);
      setError('Failed to reject batch');
    }
  };

  // Check if user has permission to access this page
  const isAuthorized = user?.role === 'admin' || user?.role === 'approver';
  
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-yellow-100 p-6">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 max-w-md mb-6">
            You don't have permission to access batch approvals. This feature is available to administrators and approvers only.
          </p>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !selectedBatch && batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12" />
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bulk Approval Management
        </h1>
        {user?.role === 'admin' && (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await api.post('/api/inspections/process-batches');
                // Refresh the list
                const response = await api.get('/api/inspections/batch');
                setBatches(response.data);
              } catch (err) {
                console.error('Error processing batches:', err);
                setError('Failed to process batches');
              }
            }}
          >
            Process Pending Inspections
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pending Batches</CardTitle>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending batches found
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div 
                      key={batch._id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedBatch?.batchId === batch._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleBatchSelect(batch._id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {batch.workflowName}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {batch.category}
                          </p>
                        </div>
                        <Badge variant="primary">
                          {batch.count} {batch.count === 1 ? 'entry' : 'entries'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {new Date(batch.firstCreatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {!selectedBatch ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">Select a batch to view details</p>
              <p className="text-xs text-gray-400">You can approve or reject multiple inspections at once</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Batch Details</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedBatch.count} {selectedBatch.count === 1 ? 'inspection' : 'inspections'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBatch(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="success"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => setShowApproveModal(true)}
                  >
                    Approve All
                  </Button>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                        {selectedBatch.inspections.some(i => i.meterReading !== undefined) && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedBatch.inspections.map((inspection) => (
                        <tr key={inspection._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(inspection.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {inspection.assignedToName}
                          </td>
                          {selectedBatch.inspections.some(i => i.meterReading !== undefined) && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {inspection.meterReading !== undefined ? inspection.meterReading : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setRemarks('');
        }}
        title="Approve All Inspections"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to approve {selectedBatch?.count || 0} inspections. This action cannot be undone.
          </p>
          <TextArea
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Add any comments or remarks about this bulk approval..."
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setRemarks('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleApproveAll}
            >
              Approve All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRemarks('');
        }}
        title="Reject All Inspections"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to reject {selectedBatch?.count || 0} inspections. This action cannot be undone.
          </p>
          <TextArea
            label="Reason for Rejection"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Please provide a reason for rejecting these inspections..."
            required
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRemarks('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleRejectAll}
              disabled={!remarks.trim()}
            >
              Reject All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchApprovalsPage;
