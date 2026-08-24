import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendWelcomeEmail = async (to, name) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Sidd Academy'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Welcome to Sidd Academy!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <h1 style="color: #6c63ff; margin-bottom: 8px;">Welcome to Sidd Academy!</h1>
          <p style="color: #333; font-size: 16px;">Hi ${name}, your account is ready. Start learning today!</p>
          <a href="${process.env.CLIENT_URL}/courses"
             style="display: inline-block; margin-top: 20px; background: #6c63ff; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Browse Courses
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};

export const sendPurchaseConfirmation = async (to, name, items, total) => {
  try {
    const transporter = createTransporter();
    const itemList = items.map(i => `<li style="padding: 4px 0;">${i.title} — ₹${i.price}</li>`).join('');
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Sidd Academy'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Purchase Successful — Sidd Academy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 32px; border-radius: 12px;">
          <h1 style="color: #6c63ff;">Purchase Confirmed! 🎉</h1>
          <p>Hi ${name}, thank you for your purchase.</p>
          <h3 style="margin-top: 20px;">Items Purchased:</h3>
          <ul style="padding-left: 20px; color: #555;">${itemList}</ul>
          <p style="font-weight: bold; font-size: 18px; margin-top: 16px;">Total: ₹${total}</p>
          <a href="${process.env.CLIENT_URL}/student/dashboard"
             style="display: inline-block; margin-top: 20px; background: #6c63ff; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Access Your Content
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
};
