// 'use strict';

// Initialize Firebase
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const serviceAccount = require('./sots-9e289-firebase-adminsdk-6iusb-f49168e100.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sots-9e289.firebaseio.com',
  storageBucket: 'sots-9e289.appspot.com',
});

const compression = require('compression');
const express = require('express');
const cors = require('cors');
const csp = require('helmet-csp');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();

const homeRoute = require('./routes/home.js');
const articleRoute = require('./routes/article.js');
const aboutRoute = require('./routes/about.js');
const randomRoute = require('./routes/random.js');
const loginRoute = require('./routes/login.js');
const addArticleRoute = require('./routes/add-article.js');
const editArticleRoute = require('./routes/edit-article.js');
const tagRoute = require('./routes/tag.js');
const privacyPolicyRoute = require('./routes/privacy-policy.js');

const isEqualHelper = (a, b, opts) => {
  if (a == b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
};

const ifInHelper = (elem, list, options) => {
  if (list.includes(elem)) {
    return options.fn(this);
  }
  return options.inverse(this);
};

const logHelper = (info) => {
  return console.log('LOGHELPER', info);
};

app.use(compression());

app.use(cors({origin: true}));

app.use(csp({
  directives: {
    upgradeInsecureRequests: true,
    defaultSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://sots-9e289.firebaseapp.com',
    ],
    scriptSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://stackpath.bootstrapcdn.com',
      'https://www.gstatic.com',
      'https://code.jquery.com',
      'https://cdnjs.cloudflare.com',
      'https://connect.facebook.net/en_US/sdk.js',
      'https://platform.twitter.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],
    styleSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      // eslint-disable-next-line quotes
      "'unsafe-inline'",
      'https://sots-9e289.firebaseapp.com',
      'https://stackpath.bootstrapcdn.com',
      'https://fonts.googleapis.com',
    ],
    fontSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://fonts.gstatic.com',
      'https://fonts.googleapis.com',
    ],
    imgSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'data:',
      'https://stackpath.bootstrapcdn.com',
      'https://sots-9e289.firebaseapp.com/',
      'https://storage.googleapis.com/sots-9e289.appspot.com/',
      'https://static.xx.fbcdn.net/',
      'https://syndication.twitter.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],
    // eslint-disable-next-line quotes
    mediaSrc: ["'none'"],
    // eslint-disable-next-line quotes
    childSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://www.facebook.com/',
      'https://m.facebook.com/',
      'https://staticxx.facebook.com/',
      'https://platform.twitter.com/',
    ],
    // eslint-disable-next-line quotes
    objectSrc: ["'none'"],
    connectSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://firestore.googleapis.com',
      'https://connect.facebook.net',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
    ],
    formAction: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://syndication.twitter.com/i/jot',
    ],
    frameSrc: [
      // eslint-disable-next-line quotes
      "'self'",
      'https://www.facebook.com/',
      'https://m.facebook.com/',
      'https://web.facebook.com/',
      'https://platform.twitter.com/',
      'https://staticxx.facebook.com/',
    ],
    frameAncestors: [
      // eslint-disable-next-line quotes
      "'self'",
    ],
  },
  loose: false,
  setAllHeaders: false,
  disableAndroid: false,
}));

// Routes
app.use('/', homeRoute);
app.use(articleRoute);
app.use(aboutRoute);
app.use(randomRoute);
app.use(loginRoute);
app.use(addArticleRoute);
app.use(editArticleRoute);
app.use(tagRoute);
app.use(privacyPolicyRoute);

app.engine('handlebars', exphbs({
  defaultLayout: 'index',
  layoutsDir: 'views/layouts',
  partialsDir: 'views/partials',
  extname: 'handlebars',
  helpers: {
    ifEqual: isEqualHelper,
    ifIn: ifInHelper,
    log: logHelper,
  },
}));
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'handlebars');

// Robots route
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('./public/robots.txt');
});

app.use(express.static(path.join(__dirname, '/public')));

exports.app = functions.https.onRequest(app);
