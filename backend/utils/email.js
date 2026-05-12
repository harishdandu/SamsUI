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
  const transporterConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      // Do not fail on invalid certs - common in some cloud environments
      rejectUnauthorized: false
    }
  };

  // If using Gmail, using 'service' is often more reliable on cloud platforms like Render
  if (transporterConfig.host.includes('gmail.com')) {
    transporterConfig.service = 'gmail';
    // Host, port, and secure are handled automatically by 'service: gmail'
    delete transporterConfig.host;
    delete transporterConfig.port;
    delete transporterConfig.secure;
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
