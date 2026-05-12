import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const sendEmail = async (options) => {
  // Gmail API Credentials
  const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
  const GMAIL_USER = process.env.SMTP_USER;

  // 1) Try sending via Gmail API (Port 443 - Never blocked)
  if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

      // Create the email content
      const subject = options.subject;
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: SAMS Elite <${GMAIL_USER}>`,
        `To: ${options.email}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        '',
        options.html || options.message,
      ];
      const message = messageParts.join('\n');

      // The body needs to be base64url encoded
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      console.log('✅ Email sent via Gmail API:', res.data.id);
      return res.data;
    } catch (apiError) {
      console.error('❌ Gmail API Error:', apiError);
      // If API fails, we fall through to the SMTP method
    }
  }

  // 2) Fallback to SMTP (Port 465/587 - May be blocked on Render)
  console.log('🔄 Falling back to SMTP method...');
  
  // Check for required environment variables
  const requiredVars = ['SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    const errorMsg = `❌ EMAIL ERROR: Missing environment variables: ${missingVars.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Create a transporter configuration
  let transporterConfig;

  if (process.env.SMTP_HOST?.includes('gmail.com') || process.env.SMTP_USER?.includes('gmail.com')) {
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };
  } else {
    transporterConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_PORT == 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from: `SAMS Elite <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent via SMTP: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Nodemailer Error Details:', error.message);
    throw error;
  }
};

export default sendEmail;
