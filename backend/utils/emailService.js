const nodemailer = require('nodemailer');

// Kiểm tra nếu có EMAIL_USER thì mới khởi tạo transporter
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 5000, // timeout 5 giây
    greetingTimeout: 5000,
  });
  console.log('Email service initialized');
} else {
  console.log('Email service disabled (no EMAIL_USER configured)');
}

// 2. hàm soạn và gửi thư chúc mừng
async function sendCertificateEmail(userEmail, userName, courseTitle, certificateId) {
  // Nếu email chưa được cấu hình → bỏ qua
  if (!transporter) {
    console.log(`Email skipped: ${userEmail} (service not configured)`);
    return;
  }

  const linkCertificate = `${process.env.CLIENT_URL || 'http://localhost:3000'}/certificates`;

  const mailOptions = {
    from: `"THNN E-Learning" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `🥳 Chúc mừng bạn đã hoàn thành khóa học: ${courseTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #6B46C1; text-align: center;">XUẤT SẮC QUÁ, ${userName.toUpperCase()} ƠI! 🎉</h2>
        <p>Chào <strong>${userName}</strong>,</p>
        <p>Đội ngũ <strong>THNN E-Learning</strong> xin chúc mừng bạn đã hoàn thành xuất sắc khóa học <strong>"${courseTitle}"</strong>.</p>
        <p>Đây là phần thưởng xứng đáng cho những nỗ lực của bạn. Hãy click vào nút bên dưới để nhận chứng chỉ nhé:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkCertificate}" style="background-color: #6B46C1; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">
            Nhận Chứng Chỉ Ngay
          </a>
        </div>
      </div>
    `
  };

  try {
    // Gửi KHÔNG await (fire-and-forget) để không chặn response certificate
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`❌ Email failed to ${userEmail}:`, err.message);
      } else {
        console.log(`✅ Email sent to ${userEmail}`);
      }
    });
  } catch (error) {
    console.error('❌ Lỗi gửi mail:', error.message);
  }
}

module.exports = { sendCertificateEmail };
