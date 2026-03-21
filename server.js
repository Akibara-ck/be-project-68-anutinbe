const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' }); 
const { setServers } = require("node:dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser')
const companies = require('./routes/companies');
const auth = require('./routes/auth');
const interviews = require('./routes/interviews');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
connectDB(); 

const app = express();
const limiter = rateLimit({
    windowMs:10*60*100,
    max:100
})
app.set('query parser','extended');
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
// app.use(mongoSanitize());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());
app.use('/api/v1/interviews',interviews);
app.use('/api/v1/auth', auth);
app.use('/api/v1/companies', companies);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log('Server running in', process.env.NODE_ENV, 'mode on port', PORT));

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
