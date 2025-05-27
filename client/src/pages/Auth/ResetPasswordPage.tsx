import React from 'react';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { Card } from '../../components/ui/Card';

const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ResetPasswordForm />
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
