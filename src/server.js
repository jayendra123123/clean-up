const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { User, Event } = require('../config'); // Destructure both models

const app = express();
const PORT = process.env.PORT || 3019;

// Middlewares

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
const session = require('express-session');
app.use(session({
  secret: 'your-secret-key', // use a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.trim(),
  },
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !phone || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const adminHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color:#333;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    </div>`;

  const userHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2>Thank You for Contacting Us!</h2>
      <p>Dear ${name},</p>
      <p>We have received your message and will get back to you shortly.</p>
      <p>Best regards,<br/>River CleanUp Team</p>
    </div>`;

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `New Contact Form: ${subject}`,
    html: adminHtml,
  };

  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank you for contacting us!',
    html: userHtml,
  };

  transporter.sendMail(adminMailOptions, (error) => {
    if (error) {
      console.error('🔥 ERROR while sending email to admin:', error);
      return res.status(500).json({ error: 'Failed to send email to admin.' });
    }

    transporter.sendMail(userMailOptions, (error) => {
      if (error) {
        console.error('🔥 ERROR while sending acknowledgment email to user:', error);
        return res.status(500).json({ error: 'Failed to send acknowledgment email.' });
      }

      res.status(200).json({ success: true, message: 'Emails sent successfully!' });
    });
  });
});

// Views
app.get('/', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/program', (req, res) => res.render('program'));
app.get('/index', (req, res) => res.render('index'));
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Logout failed");
    }
    res.redirect('/login'); 
  });
});
app.get('/login', (req, res) => {
  res.render('login');
});


// User Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ name: username });
  if (existingUser) {
    return res.send('User already exists, try another username');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name: username, email, password: hashedPassword });

  res.render('index');
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ name: username });

    if (!user) {
      return res.send('Username not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.render('index');
    } else {
      res.send('Wrong password');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.send('Wrong details');
  }
});

app.post('/submit', async (req, res) => {
  const { address, workers, date } = req.body;
  try {
    const saved = await Event.create({ address, workers, date });
    res.status(200).json(saved);
  } catch (error) {
    console.error('❌ Save failed:', error);
    res.status(400).send("Error saving event");
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('❌ Fetch failed:', error);
    res.status(500).send('Server error');
  }
});

app.delete('/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).send("Event deleted");
  } catch (error) {
    console.error('❌ Delete failed:', error);
    res.status(400).send("Error deleting event");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
