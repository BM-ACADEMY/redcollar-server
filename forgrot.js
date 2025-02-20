const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: 'redcollar@gmail.com', // Your email
    pass: 'redcollar@123' // Your email password or app password
  }
});

// Endpoint for sending reset password email
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  const mailOptions = {
    from: 'redcollar@gmail.com',
    to: email,
    subject: 'Password Reset Request',
    text: 'To reset your password, please click on the following link.'
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Password reset email sent successfully.');
  });
});

// Start server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
