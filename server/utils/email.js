import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Create SES client with configuration
const createSESClient = () => {
  return new SESClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

// We'll initialize SES when first needed
let sesClient = null;

/**
 * Send an email using AWS SES v3
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - Email body in HTML format
 * @param {string} textBody - Email body in plain text format
 * @returns {Promise} - Result from SES SendEmailCommand
 */
export const sendEmail = async (to, subject, htmlBody, textBody) => {
  // Initialize SES client if not already done
  if (!sesClient) {
    sesClient = createSESClient();
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
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
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
