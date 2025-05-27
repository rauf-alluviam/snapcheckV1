import React from 'react';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import {Card }from '../../components/ui/Card';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Forgot Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm />
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
