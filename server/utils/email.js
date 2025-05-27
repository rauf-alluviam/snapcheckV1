import AWS from 'aws-sdk';

// Don't configure AWS immediately - instead, create a function to configure it when needed
const configureAWS = () => {
  AWS.config.update({
    region: process.env.AWS_REGION || 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  return new AWS.SES({ 
    apiVersion: '2010-12-01',
    region: process.env.AWS_REGION || 'ap-south-1' // Explicitly set region here too
  });
};

// We'll initialize SES when first needed
let ses = null;

/**
 * Send an email using AWS SES
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - Email body in HTML format
 * @param {string} textBody - Email body in plain text format
 * @returns {Promise} - Result from SES.sendEmail
 */
export const sendEmail = async (to, subject, htmlBody, textBody) => {
  // Initialize SES if not already done
  if (!ses) {
    ses = configureAWS();
    // console.log("AWS SES configured with region:", process.env.AWS_REGION || 'ap-south-1');
  }
  
  const params = {
    Source: process.env.EMAIL_FROM || 'no-reply@yourdomain.com',
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent successfully:', result.MessageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Generate password reset email content
 * @param {string} userName - User's name
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full URL for password reset
 * @returns {Object} - Object containing HTML and text versions of the email
 */
export const generateResetPasswordEmail = (userName, resetToken, resetUrl) => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #dddddd;
          border-radius: 4px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          text-align: center;
          border-bottom: 1px solid #dddddd;
        }
        .content {
          padding: 20px 15px;
        }
        .button {
          display: inline-block;
          background-color:rgb(79, 82, 87);
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .footer {
          font-size: 12px;
          color: #777777;
          text-align: center;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. To proceed with the password reset, please click the button below:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: white !important;">Reset Your Password</a>
          </p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <p>For security reasons, this link will expire in 1 hour.</p>
          <p>Thank you,<br>The Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
    Hello ${userName},

    We received a request to reset your password. To proceed with the password reset, please click the link below:

    ${resetUrl}

    If you didn't request this password reset, you can safely ignore this email.

    For security reasons, this link will expire in 1 hour.

    Thank you,
    The Support Team

    This is an automated message, please do not reply to this email.
  `;

  return { htmlBody, textBody };
};
