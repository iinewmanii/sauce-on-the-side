const express = require('express');
const router = new express.Router();

router.get('/random', (req, res) => {
  res.render('random', {
    random: 'active',
  });
});

module.exports = router;
