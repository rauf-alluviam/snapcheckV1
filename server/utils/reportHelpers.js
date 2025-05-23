import dayjs from 'dayjs';
import { ReportValidationError } from './errors.js';

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    throw new ReportValidationError('Both start date and end date are required');
  }

  if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
    throw new ReportValidationError('Invalid date format');
  }

  if (dayjs(startDate).isAfter(dayjs(endDate))) {
    throw new ReportValidationError('Start date cannot be after end date');
  }
};

export const transformInspectionData = (inspection) => ({
  ID: inspection._id,
  WorkflowName: inspection.workflowName,
  Category: inspection.category,
  InspectionType: inspection.inspectionType,
  Status: inspection.status.toUpperCase(),
  Inspector: inspection.assignedTo.name,
  Approver: inspection.approverId.name,
  InspectionDate: new Date(inspection.inspectionDate).toLocaleDateString(),
  CreatedAt: new Date(inspection.createdAt).toLocaleString()
});

export const calculateInspectorStats = (inspections) => {
  const stats = new Map();

  inspections.forEach(inspection => {
    const inspector = inspection.assignedTo;
    const currentStats = stats.get(inspector._id) || {
      name: inspector.name,
      total: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      averageCompletionTime: 0
    };

    currentStats.total++;
    currentStats[inspection.status]++;

    if (inspection.completedAt && inspection.createdAt) {
      const completionTime = dayjs(inspection.completedAt).diff(inspection.createdAt, 'minute');
      currentStats.averageCompletionTime = 
        (currentStats.averageCompletionTime * (currentStats.total - 1) + completionTime) / currentStats.total;
    }

    stats.set(inspector._id, currentStats);
  });

  return Array.from(stats.values());
};

export const generateFilename = (reportType, format) => {
  const timestamp = dayjs().format('YYYY-MM-DD-HHmm');
  return `${reportType}-${timestamp}.${format}`;
};