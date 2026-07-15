import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error("SMTP configuration is missing");
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    return transporter;
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
    const mailer = getTransporter();

    await mailer.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject: 'Reset your GreenCart password',
        html: `
            <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                <h2 style="margin-bottom: 8px;">Password reset request</h2>
                <p>We received a request to reset your GreenCart password.</p>
                <p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 10px 18px; background: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px;">
                        Reset Password
                    </a>
                </p>
                <p>This link will expire in 15 minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `,
    });
};
