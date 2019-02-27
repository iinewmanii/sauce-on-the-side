const admin = require('firebase-admin');

const express = require('express');
const router = new express.Router();

const db = admin.firestore();

router.get('/tag/:id', async (req, res) => {
  try {
    let articlesList = '';
    const articles = await db.collection('articles').where('tags', 'array-contains', req.params.id).get();
    const articlesArr = articles.docs.slice();
    articlesArr.reverse((a, b) => a.data().publish_date - b.data().publish_date);
    articlesArr.forEach((doc) => {
      articlesList += '{' + '"id"' + ':' + JSON.stringify(doc.id) + '}';
    });
    articlesList = articlesList.replace(/}{/g, '},{');
    articlesList = JSON.parse('[' + articlesList + ']');
    res.render('tag', {articles: articlesList});
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
