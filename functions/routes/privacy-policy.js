const express = require('express');
const router = new express.Router();

router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy');
});

module.exports = router;
