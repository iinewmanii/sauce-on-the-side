const admin = require('firebase-admin');
const db = admin.firestore();

const express = require('express');
const router = new express.Router();

const {getBannedWordsList} = require('./utils');

router.get('/random', async (req, res) => {
  try {
    const bannedList = getBannedWordsList;
    const featuredPostsEndDate = new Date(new Date().setDate(new Date().getDate() - 30));
    const rand = Math.floor(Math.random() * Math.floor(225));
    const article = await db.collection('articles')
        .where('publish', '==', true)
        .orderBy('publish_date', 'desc')
        .offset(rand)
        .limit(2)
        .get();
    const articleArr = article.docs.slice();
    const shareUrl = 'https://sots-9e289.firebaseapp.com/articles/' + articleArr[0].id;
    let shareDescription = articleArr[0].data().body;
    shareDescription = shareDescription.replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
    const shareDescriptionFormatted = shareDescription[0] + ' ' + shareDescription[1];
    const newViewCount = articleArr[0].data().view_count + 1;
    let articleObject = '';
    const articleId = '{' + '"id"' + ':' + JSON.stringify(articleArr[0].id) + '}';
    const articleString = JSON.stringify(articleArr[0].data());
    const articleDate = articleArr[0].get('publish_date');
    let formattedDate = articleDate.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    formattedDate = '{' + '"date"' + ':' + JSON.stringify(formattedDate) + '}';
    articleObject += articleId + formattedDate + articleString;
    articleObject = articleObject.replace(/}{/g, ',');
    articleObject = JSON.parse(articleObject);
    const nextArticleId = '{' + '"id"' + ':' + JSON.stringify(articleArr[1].id) + '}';
    const nextArticleStr = JSON.stringify(articleArr[1].data());
    let nextArticleObject = nextArticleId + nextArticleStr;
    nextArticleObject = nextArticleObject.replace(/}{/g, ',');
    nextArticleObject = nextArticleObject.replace(/,*$/, '');
    nextArticleObject = JSON.parse('[' + nextArticleObject + ']');
    let sidebarId = '';
    let sidebarDate = '';
    let sidebarString = '';
    let sidebarObject = '';
    let recommend = await db.collection('articles')
        .where('publish_date', '>=', featuredPostsEndDate)
        .orderBy('publish_date')
        .orderBy('view_count')
        .limit(3)
        .get();
    recommend = recommend.docs;
    recommend.forEach((doc) => {
      console.log(doc.id);
      sidebarId = '{' + '"id"' + ':' + JSON.stringify(doc.id) + '}';
      sidebarDate = doc.get('publish_date');
      const formattedDate = sidebarDate.toDate().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      sidebarDate = '{' + '"date"' + ':' + '"' + formattedDate + '"' + '}';
      sidebarString = JSON.stringify(doc.data());
      sidebarObject += sidebarId + sidebarDate + sidebarString;
      sidebarObject = sidebarObject.replace(/}{/g, ',');
      sidebarObject = sidebarObject + ',';
    });
    sidebarObject = sidebarObject.replace(/,*$/, '');
    sidebarObject = JSON.parse('[' + sidebarObject + ']');
    db.collection('articles').doc(articleArr[0].id).update({view_count: newViewCount});
    res.render('article', {
      shareurl: shareUrl,
      sharedescription: shareDescriptionFormatted,
      article: articleObject,
      sidebar: sidebarObject,
      next: nextArticleObject,
      bannedList: bannedList,
      random: 'active',
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
