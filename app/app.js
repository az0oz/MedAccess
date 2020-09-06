const express = require('express');
const app = express();
const multer = require('multer');
const formidableMiddleware = require('express-formidable');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session')
const { check, validationResult } = require('express-validator');
const User = require('./modules/User');
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const config = require('./config/server');
const passport = require('passport');
const port = 2000;
const compression = require('compression')

//set up compression middleware
app.use(compression())

//set up template engine
app.set('view engine', 'ejs');

//set up middleware to parse css and js files
app.use(bodyParser.json());
app.use('*/assets', express.static(path.join(__dirname, './assets')));
app.use('*/scripts', express.static(path.join(__dirname, './scripts')));
app.use('*/vendor', express.static(path.join(__dirname, './vendor')));
app.use('*/build', express.static(path.join(__dirname, './build')));
app.use('*/app', express.static(path.join(__dirname, './app')));
app.use('*/', express.static(path.join(__dirname, './assets')));
app.use('/', express.static(path.join(__dirname, './assets')));
app.use(multer({dest:'./uploads'}).any());
//set up //set up non-depending routes

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}))

//set up express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// passport config 
require('./config/passport')(passport);
// passport middleware session and cookies
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next) {
  res.locals.user = req.user || null;
  next();
})

//set up non-depending routes
app.get('/home', (req, res) => {
    res.locals.title = "Home";
    res.render('index');
});
app.get('/contact',(req, res) => {
    res.locals.title = "Contact";
    res.render('contact');
});

app.get('/about', (req, res) => {
  res.locals.title = "Home";

  res.render('profile');
  
});

//Import Routes
const userRoute = require('./routes/user');
app.use('/user', userRoute);


//set up mongoose connectinon
mongoose.set('debug', true);
mongoose.connect(config.database, {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true,},
    () => {
    console.log("Connected to DB");
});



app.listen(port, () => console.log(`medaccess app listening on port `+port));
