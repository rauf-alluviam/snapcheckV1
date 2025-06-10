import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import api from '../../utils/api';
import { workflowSchemas } from '../../validation/schemas';
import { useValidation } from '../../validation/hooks';
import { handleApiValidationErrors, getErrorMessage } from '../../validation/utils';
import ValidatedInput from '../ui/ValidatedInput';

interface AutoApprovalSettingsProps {
  workflowId: string;
  initialSettings: {
    isRoutineInspection: boolean;
    autoApprovalEnabled: boolean;
    autoApprovalRules: {
      timeRangeStart: string;
      timeRangeEnd: string;
      minValue?: number;
      maxValue?: number;
      valueField: string;
      requirePhoto: boolean;
      frequencyLimit?: number;
      frequencyPeriod: 'hour' | 'day' | 'week';
    };
  };
  onSettingsUpdate: () => void;
}

const AutoApprovalSettings: React.FC<AutoApprovalSettingsProps> = ({
  workflowId,
  initialSettings,
  onSettingsUpdate
}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear messages when settings change
    setSuccessMessage('');
    setErrorMessage('');
  };
  
  const handleRuleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      autoApprovalRules: {
        ...prev.autoApprovalRules,
        [key]: value
      }
    }));
    
    // Clear messages when settings change
    setSuccessMessage('');
    setErrorMessage('');
  };
  
  const saveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await api.patch(`/api/workflows/${workflowId}/approval-settings`, settings);
      setSuccessMessage('Approval settings saved successfully!');
      onSettingsUpdate();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving approval settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <div>
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Routine Inspection</span>
            <Switch
              checked={settings.isRoutineInspection}
              onChange={(checked) => handleSettingChange('isRoutineInspection', checked)}
            />
          </label>
          <p className="text-xs text-gray-500">Routine inspections (like meter readings) can be processed differently from standard inspections.</p>
        </div>
        
        {settings.isRoutineInspection && (
          <>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Auto-Approval</span>
                <Switch
                  checked={settings.autoApprovalEnabled}
                  onChange={(checked) => handleSettingChange('autoApprovalEnabled', checked)}
                />
              </label>
              <p className="text-xs text-gray-500">If enabled, inspections meeting criteria will be automatically approved without manual review.</p>
            </div>
            
            {settings.autoApprovalEnabled && (
              <div className="space-y-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Auto-Approval Rules</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valid Time Start</label>
                    <Input
                      type="time"
                      value={settings.autoApprovalRules.timeRangeStart}
                      onChange={(e) => handleRuleChange('timeRangeStart', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">Start of allowed submission time</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valid Time End</label>
                    <Input
                      type="time"
                      value={settings.autoApprovalRules.timeRangeEnd}
                      onChange={(e) => handleRuleChange('timeRangeEnd', e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">End of allowed submission time</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Value</label>
                    <Input
                      type="number"
                      value={settings.autoApprovalRules.minValue || ''}
                      onChange={(e) => handleRuleChange('minValue', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional"
                    />
                    <p className="mt-1 text-xs text-gray-500">Minimum allowed value (e.g., meter reading)</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Value</label>
                    <Input
                      type="number"
                      value={settings.autoApprovalRules.maxValue || ''}
                      onChange={(e) => handleRuleChange('maxValue', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional"
                    />
                    <p className="mt-1 text-xs text-gray-500">Maximum allowed value (e.g., meter reading)</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Field to Check</label>
                    <Input
                      type="text"
                      value={settings.autoApprovalRules.valueField}
                      onChange={(e) => handleRuleChange('valueField', e.target.value)}
                      placeholder="e.g., responseText"
                    />
                    <p className="mt-1 text-xs text-gray-500">Field name containing the value to check</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Require Photo</span>
                      <Switch
                        checked={settings.autoApprovalRules.requirePhoto}
                        onChange={(checked) => handleRuleChange('requirePhoto', checked)}
                      />
                    </label>
                    <p className="text-xs text-gray-500">Require attached media for auto-approval</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Submission Frequency Limit</label>
                    <Input
                      type="number"
                      value={settings.autoApprovalRules.frequencyLimit || ''}
                      onChange={(e) => handleRuleChange('frequencyLimit', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Optional"
                    />
                    <p className="mt-1 text-xs text-gray-500">Max submissions allowed in the period</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frequency Period</label>
                    <Select
                      options={[
                        { value: 'hour', label: 'Per Hour' },
                        { value: 'day', label: 'Per Day' },
                        { value: 'week', label: 'Per Week' }
                      ]}
                      value={settings.autoApprovalRules.frequencyPeriod}
                      onChange={(value) => handleRuleChange('frequencyPeriod', value)}
                    />
                    <p className="mt-1 text-xs text-gray-500">Time period for frequency limit</p>
                  </div>
                </div>              </div>
            )}
          </>
        )}
        
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={saveSettings}
            isLoading={isSaving}
            disabled={isSaving}
          >
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoApprovalSettings;
