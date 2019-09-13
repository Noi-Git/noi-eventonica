const express = require('express');
const connectDB = require('./config/db');
// validate - search more info at express-validator

const app = express();

// Connect Database
connectDB();

// Init Middleware - used to be bodyParser.json() - now do the below
// it helps us get data from users.js when we do - req.body
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running')); //single endpoint

// Define Routes -- when type ex. /api/users - it will go get /routes/api/user
app.use('/api/users', require('./routes/api/users'));
// app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
