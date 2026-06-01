const nodemailer = require('nodemailer');

const getMailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
};

/**
 * Reusable email service to send verification OTP via Nodemailer SMTP
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = getMailTransporter();
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Spotify Clone Verification</title>
</head>
<body style="margin:0;padding:0;background:#121212;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#181818;margin-top:30px;border-radius:16px;overflow:hidden;">

<tr>
<td align="center" style="background:#1DB954;padding:30px;">
<h1 style="color:white;margin:0;font-size:32px;">
🎵 Spotify Clone
</h1>
</td>
</tr>

<tr>
<td style="padding:40px;color:white;">

<h2 style="margin-top:0;">
Verify Your Account
</h2>

<p style="font-size:16px;color:#b3b3b3;">
Hello,
</p>

<p style="font-size:16px;color:#b3b3b3;">
Use the verification code below to complete your login/signup.
</p>

<div style="
background:#1DB954;
padding:20px;
border-radius:12px;
text-align:center;
margin:30px 0;
">

<h1 style="
color:white;
font-size:42px;
letter-spacing:8px;
margin:0;
">
${otp}
</h1>

</div>

<p style="color:#b3b3b3;font-size:15px;">
This code will expire in <strong>5 minutes</strong>.
</p>

<p style="color:#b3b3b3;font-size:15px;">
If you didn't request this verification, you can safely ignore this email.
</p>

<hr style="border:none;border-top:1px solid #333;margin:30px 0;">

<p style="text-align:center;color:#777;font-size:13px;">
Spotify Clone Team
<br>
Secure Authentication System
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@spotifyclone.com',
    to: email,
    subject: 'Spotify Clone Verification Code',
    text: `Hello,\n\nYour verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nSpotify Clone Team`,
    html: htmlTemplate,
  };
  await transporter.sendMail(mailOptions);
  console.log(`[Email Service] OTP successfully sent to: ${email}`);
};

module.exports = {
  sendOTPEmail,
};
