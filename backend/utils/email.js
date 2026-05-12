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

  // Use service: 'gmail' as it is generally the most robust
  if (process.env.SMTP_HOST?.includes('gmail.com') || process.env.SMTP_USER?.includes('gmail.com')) {
    transporterConfig = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true, // Enable debug output
      logger: true  // Log to console
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

  console.log('📧 Initializing email transporter with config:', {
    service: transporterConfig.service,
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    user: transporterConfig.auth.user
  });

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
