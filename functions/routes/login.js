const firebase = require('firebase');
const admin = require('firebase-admin');
const firebaseConfig = require('../firebase-config.json');
firebase.initializeApp(firebaseConfig);

const express = require('express');
const router = new express.Router();
const Busboy = require('busboy');

router.get('/login', (req, res) => {
  res.render('login', {
    fromUrl: req.query.fromUrl,
  });
});

router.post('/login', async (req, res) => {
  const busboy = new Busboy({headers: req.headers});
  busboy.on('field', (fieldname, value) => {
    if (!req.body) req.body = {};
    req.body[fieldname] = value;
  });
  busboy.on('finish', async () => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const signIn = await firebase.auth().signInWithEmailAndPassword(email, password);
      const idToken = await signIn.user.getIdToken(true);
      const verifiedToken = await admin.auth().verifyIdToken(idToken);
      res.redirect(req.body.fromUrl + '?user=' + verifiedToken.uid);
    } catch (err) {
      console.error(err);
      res.redirect('/login');
    }
  });
  busboy.end(req.rawBody);
});

module.exports = router;
