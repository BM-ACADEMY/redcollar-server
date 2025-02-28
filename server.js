const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const dotenv= require('dotenv');
const app = express();
app.use(express.json());
const crypto = require('crypto'); 
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const cors=require('cors');
const fs = require('fs');
const bodyParser=require('body-parser');
const razorpay=require('razorpay');

dotenv.config();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// const razorpay= new Razorpay({
//   key_id:"rzp_test_1nMmT4lAg1n4uc",
//   key_secret:"YpT79WSN0DMuveEyyaQewJAB",
// });


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer storage for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save image to 'uploads' folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname); // Name the image with unique suffix
  },
});
app.use(morgan('dev'));
const upload = multer({ storage: storage });


const addressRoute=require('./routes/AddressRoute');
const categoryRoute=require('./routes/CategoryRoute');
const orderRoute=require('./routes/OrderRoute');
const paymentRoute=require('./routes/PaymentRoute');
const productRoute=require('./routes/ProductRoute');
const promotionRoute=require('./routes/PromotionRoute');
const reviewRoute=require('./routes/ReviewRoute');
const userRoute=require('./routes/UserRoute');
const cartRoute=require('./routes/CartRoute');
const typeRoute=require('./routes/TypeRoute');
const linkedProductRoute=require('./routes/LikedproductRoute');
const Razorpay = require('razorpay');


app.use('/api/address',addressRoute);
app.use('/api/category',categoryRoute);
app.use('/api/orders',orderRoute);
app.use('/api/payments',paymentRoute);
app.use('/api/reviews',reviewRoute);
app.use('/api/users',userRoute);
app.use('/api/promotions',promotionRoute);
app.use('/api/products',productRoute);
app.use('/api/carts',cartRoute);
app.use('/api/types',typeRoute)
app.use('/api/linkedproducts',linkedProductRoute);


mongoose.set('strictPopulate', false);
// MongoDB connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: {type:String},
  resetTokenExpiration: {type:Date}
});

const User = mongoose.model('users', userSchema);

// Register user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(req.body);
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});
// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email matches the admin credentials
    if (email === 'redcollar@gmail.com' && password === 'redcollar@123') {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        username: 'redcollar',
        isAdmin: true,
      });
    }

    // Check if user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Login successful
    res.status(200).json({
      success: true,
      message: 'Login successful',
      username: email.split('@')[0],
      isAdmin: user.isAdmin || false,
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// Endpoint for sending reset password email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'clinetredcollar@gmail.com',
    pass: 'ipehalalhlzctbun'
  },
  tls: {
    rejectUnauthorized: false 
  }
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log(email);
  

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a reset token (hex) and set expiration time (30 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store token and expiration in the database
    user.resetToken = resetToken;
    user.resetTokenExpiration = expirationTime;
    await user.save();

    // Generate password reset link
    const resetLink = `http://10.0.2.2:6000/reset-password?token=${resetToken}`;
    
    

    const mailOptions = {
      from: 'clinetredcollar@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">Reset Password</a>
        <p>This link is valid for 30 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to send email', error: error.toString() });
      }
      res.status(200).json({ message: 'Password reset email sent successfully.' });
    });

  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error });
  }
});
// ✅ Reset Password (Verify Token & Update Password)
app.post('/reset-password', async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Both password fields are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() } // Check token expiration
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and remove token
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
});
// Define Shoes  schema
const Shoesschema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId, // Unique identifier
  brand: { type: String, required: true },
  color: { type: String, required: true },
  image: { type: String, required: true }, // Path or URL to the image
  material: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, required: true },
  sizes: {
    L: { type: Boolean, required: true },
    M: { type: Boolean, required: true },
    S: { type: Boolean, required: true },
    XL: { type: Boolean, required: true }
  },
  stock: { type: Number, required: true },
  type: { type: String, required: true }, // e.g., "Wristwatch"
  collection: { type: String, required: true }, // e.g., "Luxury Watches"
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
//Define accesries schema

const accesriesschema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId, // Unique identifier
  brand: { type: String, required: true },
  color: { type: String, required: true },
  image: { type: String, required: true }, // Path or URL to the image
  material: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, required: true },
  sizes: {
    L: { type: Boolean, required: true },
    M: { type: Boolean, required: true },
    S: { type: Boolean, required: true },
    XL: { type: Boolean, required: true }
  },
  stock: { type: Number, required: true },
  type: { type: String, required: true }, // e.g., "Wristwatch"
  collection: { type: String, required: true }, // e.g., "Luxury Watches"
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const promotions=new mongoose.Schema({
  title:{
    type:String,
    required:[true,"please provide title"]
  },
  Image:{
    type:String,
    required:[true,"please provide Image"]
  }
})


// Create the model
const Shoes = mongoose.model('shoes', Shoesschema);
const  Accessories= mongoose.model('accessories', accesriesschema);
const Overcase = mongoose.model('overcase', accesriesschema);

const Jeans = mongoose.model('jeans', accesriesschema);
const Clothes = mongoose.model('clothes', accesriesschema);
const hoodies = mongoose.model('Hoodies', accesriesschema);

const Clinets = mongoose.model('users', userSchema);
const uaerpromo=mongoose.model("promo",promotions)




app.get('/shoes', async (req, res) => {
  try {
    const products = await Shoes.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});


app.get("/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.status(200).json(users); // Send the list of users as the response
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users." });
  }
});

// app.post('/addUser', async (req, res) => {
//   const { name, email, password } = req.body;
//   console.log(req.body);
  
   
//   // Check if email and password are provided
//   if (!email || !password || !name) {
//     return res.status(400).json({ message: 'Name, Email, and Password are required' });
//   }

//   try {
//     // Check if the user already exists with the same email
//     const existingUser = await User.findOne({  email });
//     console.log("extr5567",existingUser);
    
//     if (existingUser) {
//       return res.status(400).json({ message: 'User with this email already exists' });
//     }

//     // Hash the password before saving it
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create a new user with the name, email, and hashed password
//     const newUser = new User({
//       name,  // Save the name
//       email,
//       password: hashedPassword,
//     });

//     // Save the user to the database
//     await newUser.save();

//     // Respond with a success message
//     res.status(200).json({ message: 'User added successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error adding user', error });
//   }
// });


// Update user by email
app.put('/updateUserById/:id', async (req, res) => {
  const { id } = req.params;
  const { email,password, username } = req.body;
console.log(id,'id')
console.log(req.body);

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'New Email, Username, and Password are required' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id, // Find user by ID
      { email: email, password: password, username: username }, // Update user fields
      { new: true } // Return updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});
// Delete user by email
app.delete('/deleteUserById/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id,'id');
  
  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});
app.get('/accessories', async (req, res) => {
  try {
    const tShirts = await Accessories.find();
    res.json(tShirts);
  } catch (error) {
    res.status(500).send('Error fetching T-shirts');
  }
});

app.get('/jeans', async (req, res) => {
  try {
    const jeans = await Jeans.find();
    res.json(jeans);
  } catch (error) {
    res.status(500).send('Error fetching jeans');
  }
});

app.get('/overcase', async (req, res) => {
  try {
    const overcoats = await Overcase.find();
    res.json(overcoats);
  } catch (error) {
    res.status(500).send('Error fetching overcoats');
  }
});

app.get('/hoodiess', async (req, res) => {
  try {
    const hodeisss = await hoodies.find();
    res.json(hodeisss);
  } catch (error) {
    res.status(500).send('Error fetching accessories');
  }
});

app.get('/clothes', async (req, res) => {
  try {
    const clothes = await Clothes.find();
    res.json(clothes);
  } catch (error) {
    res.status(500).send('Error fetching clothes');
  }
});

app.get("/promotions-getAll", async (req, res) => {
  try {
    const promotions = await uaerpromo.find();
    res.status(200).json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get("/promotions-getById/:id", async (req, res) => {
  try {
    const promotion = await uaerpromo.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/promotions-create", upload.single('Image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`; // Generate the image URL

    // Create the promotion with title and image URL
    const newPromotion = new uaerpromo({ title, Image: imageUrl });
    await newPromotion.save();

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion: newPromotion,
      Image: imageUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 3. Serve Uploaded Image
app.use('/uploads', express.static(uploadDir)); // Serve uploaded images
app.get("/get-image/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'uploads', imageName);

  res.sendFile(imagePath, (err) => {
    if (err) {
      res.status(404).json({ message: "Image not found" });
    }
  });
});

// ✅ PUT (Update a promotion by ID)
app.put("/promotions-update/:id", async (req, res) => {
  const { title, Image } = req.body;
  try {
    const updatedPromotion = await uaerpromo.findByIdAndUpdate(
      req.params.id,
      { title, Image },
      { new: true, runValidators: true }
    );
    if (!updatedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json(updatedPromotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ DELETE (Delete a promotion by ID)
app.delete("/promotions-delete/:id", async (req, res) => {
  try {
    const deletedPromotion = await uaerpromo.findByIdAndDelete(req.params.id);
    if (!deletedPromotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }
    res.status(200).json({ message: "Promotion deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// const admin = require('firebase-admin');
// const { type } = require('os');
// const { log } = require('console');

// // Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(require('./redcollar-92563-firebase-adminsdk-ydifl-b72f714292.json'))
// });

// Send Push Notification
// const sendNotification = async (fcmToken, title, body) => {
//   const message = {
//     token: fcmToken, // FCM token of the device
//     notification: {
//       title: title, // Notification title
//       body: body,   // Notification body
//     },
//     // You can add other fields like data if needed
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     console.log('Successfully sent message:', response);
//   } catch (error) {
//     console.log('Error sending message:', error);
//   }
// };

// // Example usage
// const fcmToken = 'diaifjuHQceqcKy63mXOMS:APA91bHz3KVV1Vssvn5xDlatWWcxrucolF7TBrcDPq2HSqRqMn4nZBtSLujuNupwS3dtUg7WHO1x8okSPaXISWTZoTqCAR5MwrgyJnwmUDYEGa5RkRvbmG4';
// sendNotification(fcmToken, 'New Arrival!', 'Check out the latest products!');


const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

