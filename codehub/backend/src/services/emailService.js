const nodemailer = require('nodemailer');

console.log('[EmailService] Initializing...');

// SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'false' ? false : true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateHtmlTemplate = (otp) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
        <div style="background-color: #24292e; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">CodeHub Secure Login</h1>
        </div>
        <div style="padding: 40px 20px; text-align: center;">
            <p style="color: #586069; font-size: 16px; margin-bottom: 30px;">
                You requested a secure login verification code. Please use the OTP below to complete your authentication.
            </p>
            <div style="background-color: #f6f8fa; border: 1px solid #d1d5da; border-radius: 6px; padding: 15px; display: inline-block;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #24292e; letter-spacing: 5px;">
                    ${otp}
                </span>
            </div>
            <p style="color: #d73a49; font-size: 14px; margin-top: 30px; font-weight: bold;">
                This code expires in 5 minutes.
            </p>
            <p style="color: #586069; font-size: 12px; margin-top: 10px;">
                If you did not request this code, please ignore this email or contact support.
            </p>
        </div>
        <div style="background-color: #fafbfc; padding: 15px; text-align: center; border-top: 1px solid #e1e4e8;">
            <p style="color: #959da5; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} CodeHub Inc. All rights reserved.
            </p>
        </div>
    </div>
`;

async function sendViaSMTP(email, otp) {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
        throw new Error('Email credentials not configured in .env (EMAIL_USER is missing or default)');
    }

    try {
        // Verify connection config
        await transporter.verify();
    } catch (verifyError) {
        console.error('SMTP Connection Error Details:', verifyError);
        throw new Error(`SMTP Connection Failed: ${verifyError.code || verifyError.message}`);
    }

    await transporter.sendMail({
        from: `"CodeHub Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'CodeHub Verification Code',
        html: generateHtmlTemplate(otp),
        text: `Your OTP is ${otp}`
    });
    console.log(`✅ [SMTP] Email sent to ${email}`);
    return true;
}

exports.sendOTP = async (email, otp) => {
    try {
        // Priority 1: SMTP
        return await sendViaSMTP(email, otp);

    } catch (error) {
        console.error('❌ [EmailService] Gmail failed:', error.message);

        // Priority 2: Dev Mode (Console Log)
        console.log('\n================ DEV MODE OTP ================');
        console.log(`To: ${email}`);
        console.log(`Code: ${otp}`);
        console.log('==============================================\n');

        return false; // Email failed, but likely captured by devOtp return
    }
};
