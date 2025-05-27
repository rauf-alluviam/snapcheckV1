import React from 'react';
import { Card } from '../../components/ui/Card';
import ChangePasswordForm from '../../components/auth/ChangePasswordForm';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const ChangePasswordPage: React.FC = () => {
  return (
    <ProtectedRoute
      element={
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Change Password</h1>
          <div className="max-w-2xl">
            <Card className="p-6">
              <ChangePasswordForm />
            </Card>
          </div>
        </div>
      }
    />
  );
};

export default ChangePasswordPage;
