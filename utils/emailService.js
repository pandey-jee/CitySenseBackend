const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send notification email
const sendNotificationEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email service not configured');
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send issue notification to admin
const sendIssueNotification = async (issue) => {
  const subject = `New Issue Reported: ${issue.title}`;
  const html = `
    <h2>New Issue Reported on CitySense</h2>
    <p><strong>Title:</strong> ${issue.title}</p>
    <p><strong>Category:</strong> ${issue.category}</p>
    <p><strong>Severity:</strong> ${issue.severity}/5</p>
    <p><strong>Description:</strong> ${issue.description}</p>
    <p><strong>Location:</strong> ${issue.location.lat}, ${issue.location.lng}</p>
    ${issue.location.address ? `<p><strong>Address:</strong> ${issue.location.address}</p>` : ''}
    ${issue.imageURL ? `<p><strong>Image:</strong> <a href="${issue.imageURL}">View Image</a></p>` : ''}
    <p><strong>Reported At:</strong> ${new Date(issue.timestamp).toLocaleString()}</p>
    
    <p>Please review and take appropriate action.</p>
  `;

  // In a real application, you would get admin emails from the database
  const adminEmails = ['admin@citysense.com']; // Replace with actual admin emails
  
  for (const email of adminEmails) {
    await sendNotificationEmail(email, subject, html);
  }
};

// Send issue resolution notification
const sendResolutionNotification = async (issue, userEmail) => {
  const subject = `Issue Resolved: ${issue.title}`;
  const html = `
    <h2>Your Issue Has Been Resolved</h2>
    <p>Dear CitySense User,</p>
    <p>We're pleased to inform you that your reported issue has been resolved.</p>
    
    <p><strong>Issue Details:</strong></p>
    <p><strong>Title:</strong> ${issue.title}</p>
    <p><strong>Category:</strong> ${issue.category}</p>
    <p><strong>Description:</strong> ${issue.description}</p>
    <p><strong>Location:</strong> ${issue.location.lat}, ${issue.location.lng}</p>
    <p><strong>Resolved At:</strong> ${new Date().toLocaleString()}</p>
    
    <p>Thank you for helping improve our community through CitySense!</p>
    
    <p>Best regards,<br>The CitySense Team</p>
  `;

  await sendNotificationEmail(userEmail, subject, html);
};

module.exports = {
  sendNotificationEmail,
  sendIssueNotification,
  sendResolutionNotification
};
