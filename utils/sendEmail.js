const { set } = require('mongoose');
const nodemailer = require('nodemailer');

// Create transporter once and reuse it
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 4000,
    rateLimit: 14,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
});

const sendEmail = async (options) => {
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Email sent:', info.messageId);
    } catch (err) {
        console.error('Email error:', err);
        throw err;
    }
};

module.exports = sendEmail;