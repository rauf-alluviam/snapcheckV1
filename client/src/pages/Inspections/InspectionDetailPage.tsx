import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TextArea from '../../components/ui/TextArea';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarIcon, Download, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { Inspection } from '../../types';

const InspectionDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { user } = state;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const response = await api.get(`/api/inspections/${id}`);
        setInspection(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load inspection details');
        setLoading(false);
      }
    };

    fetchInspection();
  }, [id]);
  const handleApprove = async () => {
    try {
      await api.put(`/api/inspections/${id}/approve`, { remarks });
      setInspection(prev => prev ? { ...prev, status: 'approved' } : null);
      setShowApproveModal(false);
      setRemarks('');
    } catch (err) {
      console.error("Approval error:", err);
      setError('Failed to approve inspection');
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/api/inspections/${id}/reject`, { remarks });
      setInspection(prev => prev ? { ...prev, status: 'rejected' } : null);
      setShowRejectModal(false);
      setRemarks('');
    } catch (err) {
      setError('Failed to reject inspection');
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.get(`/api/inspections/${id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inspection-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          <XCircle className="h-12 w-12" />
        </div>
        <p className="text-gray-600">{error || 'Inspection not found'}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/inspections')}
        >
          Back to Inspections
        </Button>
      </div>
    );
  }
  const isAdmin = user?.role === 'admin';
  const isPrimaryApprover = user?.role === 'approver' && inspection.approverId === user._id;
  
  // Check if user is in the approvers list
  const isInApproversList = user?.role === 'approver' && 
    inspection.approvers?.some(approver => approver.userId === user._id);
  
  // User can approve if they are an admin, the primary approver, or in the approvers list
  const isApprover = isPrimaryApprover || isInApproversList;
  
  // Get this specific approver's status if they're in the list
  const currentApproverStatus = user?._id ? 
    inspection.approvers?.find(approver => approver.userId === user._id)?.status : undefined;
  
  // Can approve if admin, or approver with pending status, and overall inspection status is pending
  const canApprove = (isAdmin || (isApprover && currentApproverStatus !== 'approved')) 
    && inspection.status === 'pending';

  // Check if this inspection was created by an approver and needs admin approval
  const isCreatedByApprover = inspection.assignedTo === inspection.approverId ||
    (inspection.approvers?.some(approver => approver.userId === inspection.assignedTo));

  // Find admin approver
  const adminApprover = inspection.approvers?.find(approver => 
    approver.userName?.toLowerCase().includes('admin')
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {inspection.workflowName}
          </h1>
          <p className="text-sm text-gray-500">ID: {inspection._id}</p>
          
          {isCreatedByApprover && inspection.status === 'pending' && (
            <div className="mt-2 flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              <AlertCircle size={16} className="mr-2" />
              <p className="text-sm font-medium">
                This inspection was created by an approver and requires admin approval
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadReport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download Report
          </Button>
          {canApprove && (
            <>
              <Button
                variant="success"
                onClick={() => setShowApproveModal(true)}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge
                  variant={
                    inspection.status === 'approved'
                      ? 'success'
                      : inspection.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {inspection.status.toUpperCase()}
                </Badge>                {isCreatedByApprover && inspection.status === 'pending' && (
                  <Badge variant="warning" className="ml-2">
                    Requires Admin Approval
                  </Badge>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p>{inspection.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <p>{inspection.inspectionType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {new Date(inspection.inspectionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Inspector</label>
                <p className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {inspection.assignedToName}                  {isCreatedByApprover && inspection.assignedTo === inspection.approverId && (
                    <Badge variant="secondary" className="ml-2 text-xs">Created by Approver</Badge>
                  )}
                </p>
              </div>              <div>
                <label className="text-sm font-medium text-gray-500">Primary Approver</label>
                <p className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {inspection.approverName}
                </p>
              </div>
              
              {inspection.approvers && inspection.approvers.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">All Approvers</label>
                  <div className="space-y-2 mt-1">
                    {inspection.approvers.map(approver => (
                      <div key={approver.userId} className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{approver.userName || 'Unknown'}</span>                          {approver.userId === inspection.assignedTo && (
                            <Badge variant="secondary" className="ml-2 text-xs">Creator</Badge>
                          )}                          {adminApprover?.userId === approver.userId && isCreatedByApprover && (
                            <Badge variant="warning" className="ml-2 text-xs">Admin Approval Required</Badge>
                          )}
                        </div>
                        <Badge
                          variant={
                            approver.status === 'approved'
                              ? 'success'
                              : approver.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                          }
                          className="text-xs"
                        >
                          {approver.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p>{new Date(inspection.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p>{new Date(inspection.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inspection Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {inspection.filledSteps?.map((step, index) => (
              <div key={step.stepId} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-medium text-gray-900 mb-2">
                  {index + 1}. {step.stepTitle}
                </h3>
                <p className="text-gray-600 mb-2">{step.responseText}</p>
                {step.mediaUrls && step.mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {step.mediaUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Step ${index + 1} media ${i + 1}`}
                        className="w-24 h-24 object-cover rounded cursor-pointer"
                        onClick={() => setCurrentMediaUrl(url)}
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(step.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setRemarks('');
        }}
        title="Approve Inspection"
      >
        <div className="space-y-4">          <TextArea
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Add any comments or remarks about this approval..."
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
            <Button variant="success" onClick={handleApprove}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRemarks('');
        }}
        title="Reject Inspection"
      >
        <div className="space-y-4">          <TextArea
            label="Reason for Rejection"
            value={remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Please provide a reason for rejecting this inspection..."
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
              onClick={handleReject}
              disabled={!remarks.trim()}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!currentMediaUrl}
        onClose={() => setCurrentMediaUrl(null)}
        title="Media Preview"
      >
        <div className="flex justify-center">
          <img
            src={currentMediaUrl || ''}
            alt="Media preview"
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </Modal>
    </div>
  );
};

export default InspectionDetailPage;