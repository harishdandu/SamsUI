import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Check for required environment variables
  const requiredVars = ['SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    const errorMsg = `❌ EMAIL ERROR: Missing environment variables: ${missingVars.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 1) Create a transporter configuration
  let transporterConfig;

  // For Gmail on Render, port 465 with secure: true is the most reliable
  if (process.env.SMTP_HOST?.includes('gmail.com') || process.env.SMTP_USER?.includes('gmail.com')) {
    transporterConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };
  } else {
    // Generic configuration for other services
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

  // 2) Define the email options
  const mailOptions = {
    from: `SAMS Elite <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Nodemailer Error Details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

export default sendEmail;
