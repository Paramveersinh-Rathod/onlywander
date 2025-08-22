const nodemailer = require('nodemailer');

// Configure the transporter using your email service credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a professional-looking OTP email.
 * @param {string} to - The recipient's email address.
 * @param {string} otp - The one-time password to send.
 */
const sendOtpEmail = async (to, otp) => {
    const mailOptions = {
        from: `"OnlyWander" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your One-Time Password (OTP) for OnlyWander',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #fe424d;">Confirm Your Identity</h2>
                <p>Hello,</p>
                <p>Thank you for signing up with OnlyWander. Please use the following One-Time Password (OTP) to complete your registration. This OTP is valid for 10 minutes.</p>
                <div style="text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; background-color: #f2f2f2; padding: 10px 20px; border-radius: 5px; letter-spacing: 4px;">
                        ${otp}
                    </span>
                </div>
                <p>If you did not request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 0.9em; color: #777;">
                    Best regards,<br/>
                    The OnlyWander Team
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Could not send OTP email.');
    }
};

/**
 * Sends a booking request email to the host.
 * @param {string} to - The host's email address.
 * @param {object} bookingDetails - The details of the booking request.
 */
const sendBookingRequestEmail = async (to, bookingDetails) => {
    const { listingTitle, guestName, guestEmail, checkin, checkout, guests, contact, message } = bookingDetails;

    const mailOptions = {
        from: `"OnlyWander" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `New Booking Request for "${listingTitle}"`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                <h2 style="color: #fe424d;">You have a new booking request!</h2>
                <p>Hello,</p>
                <p>A guest has requested to book your property, <strong>${listingTitle}</strong>. Here are the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Guest Name:</td><td style="padding: 8px;">${guestName}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Guest Email:</td><td style="padding: 8px;">${guestEmail}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Contact Number:</td><td style="padding: 8px;">${contact}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Stay Duration:</td><td style="padding: 8px;">${checkin}</td></tr>
                    <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px; font-weight: bold;">Number of Guests:</td><td style="padding: 8px;">${guests}</td></tr>
                </table>
                ${message ? `
                    <h3 style="color: #333; border-top: 1px solid #eee; padding-top: 20px;">Message from Guest:</h3>
                    <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">"${message}"</p>
                ` : ''}
                <p>Please log in to your OnlyWander account to respond to this request.</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 0.9em; color: #777;">
                    Best regards,<br/>
                    The OnlyWander Team
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Booking request email sent successfully');
    } catch (error) {
        console.error('Error sending booking request email:', error);
        throw new Error('Could not send booking request email.');
    }
};


module.exports = { sendOtpEmail, sendBookingRequestEmail };
