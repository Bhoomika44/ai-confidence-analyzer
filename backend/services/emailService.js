const nodemailer = require('nodemailer');

/*
 * Send password reset email with a 4-digit verification code.
 */

exports.sendPasswordResetEmail = async (toEmail, resetCode) => {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  const from =
    process.env.EMAIL_FROM ||
    `"AI Confidence Analyzer" <${user || 'no-reply@example.com'}>`;

  const subject =
    'Your Password Reset Verification Code - AI Confidence Analyzer';

  if (!host || !user || !pass) {
    console.error('[EmailService] Email service is not configured.');
    console.error('[EmailService] Required variables:');
    console.error('EMAIL_HOST');
    console.error('EMAIL_PORT');
    console.error('EMAIL_USER');
    console.error('EMAIL_PASS');

    return {
      success: false,
      error: 'Email service not configured'
    };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 24px;
        }

        .card {
          background-color: #1e293b;
          border-radius: 16px;
          border: 1px solid #334155;
          max-width: 520px;
          margin: 0 auto;
          padding: 32px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .logo {
          font-size: 20px;
          font-weight: 800;
          color: #6366f1;
          text-align: center;
          margin-bottom: 24px;
        }

        .title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          margin-bottom: 12px;
        }

        .desc {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 24px;
        }

        .code-box {
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.15),
            rgba(168, 85, 247, 0.15)
          );
          border: 2px dashed #6366f1;
          border-radius: 12px;
          padding: 18px;
          text-align: center;
          margin: 24px 0;
        }

        .code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 32px;
          font-weight: 900;
          letter-spacing: 8px;
          color: #ffffff;
          margin: 0;
        }

        .footer {
          font-size: 12px;
          color: #64748b;
          text-align: center;
          margin-top: 32px;
          border-top: 1px solid #334155;
          padding-top: 16px;
        }
      </style>
    </head>

    <body>
      <div class="card">

        <div class="logo">
          ⚡ AI Confidence Analyzer
        </div>

        <div class="title">
          Password Reset Verification
        </div>

        <p class="desc">
          You requested to reset your password.
          Use the verification code below to complete
          the reset process:
        </p>

        <div class="code-box">
          <p class="code">${resetCode}</p>
        </div>

        <p class="desc" style="font-size: 12px;">
          This code will expire in
          <strong>15 minutes</strong>.
          If you did not request a password reset,
          you can safely ignore this email.
        </p>

        <div class="footer">
          &copy; ${new Date().getFullYear()}
          AI Confidence Analyzer Platform.
          All rights reserved.
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,

      // Prefer IPv6 because your computer can currently
      // resolve and reach smtp.gmail.com through IPv6.
      family: 6,

      auth: {
        user: user,
        pass: pass
      }
    });

    await transporter.verify();

    console.log('[EmailService] SMTP connection verified.');

    const info = await transporter.sendMail({
      from: from,
      to: toEmail,
      subject: subject,
      html: html
    });

    console.log(
      `[EmailService] Password reset email sent to ${toEmail}`
    );

    console.log(
      `[EmailService] Message ID: ${info.messageId}`
    );

    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error(
      '[EmailService] Failed to send email:',
      error.message
    );

    return {
      success: false,
      error:
        'Failed to send verification email. Please check the email configuration.'
    };
  }
};