const admin = require('firebase-admin');
const db = admin.firestore();

const express = require('express');
const router = new express.Router();

const {getBannedWordsList} = require('./utils');

router.get('/articles/:id', async (req, res) => {
  try {
    const bannedList = getBannedWordsList;
    const shareUrl = 'https://sauceots.com/articles/' + req.params.id;
    const byViewCount = [];
    const featuredPostsEndDate = new Date(new Date().setDate(new Date().getDate() - 60));
    const articleRef = db.collection('articles').doc(req.params.id);
    const article = await articleRef.get();
    let shareDescription = article.data().body;
    shareDescription = shareDescription.replace(/([.?!])\s*(?=[A-Z])/g, '$1|').split('|');
    const shareDescriptionFormatted = shareDescription[0] + ' ' + shareDescription[1];
    const articles = await db.collection('articles').where('publish_date', '>=', featuredPostsEndDate).get();
    const nextArticleArr = articles.docs.slice();
    nextArticleArr.reverse((a, b) => a.data().publish_date - b.data().publish_date);
    let index = nextArticleArr.findIndex((x) => x.id === req.params.id);
    index += 1;
    const nextArticle = nextArticleArr[index];
    const nextArticleId = '{' + '"id"' + ':' + JSON.stringify(nextArticle.id) + '}';
    const nextArticleStr = JSON.stringify(nextArticle.data());
    let nextArticleObject = nextArticleId + nextArticleStr;
    nextArticleObject = nextArticleObject.replace(/}{/g, ',');
    nextArticleObject = nextArticleObject.replace(/,*$/, '');
    nextArticleObject = JSON.parse('[' + nextArticleObject + ']');
    const byTag = articles.docs.slice();
    byTag.forEach((doc) => {
      if (doc.id != req.params.id) {
        let count = 0;
        article.data().tags.some((value) => {
          if (doc.data().tags.includes(value)) {
            count++;
            if (count == 3) {
              byViewCount.push(doc);
              return;
            }
          }
        });
      }
    });
    let sidebarId = '';
    let sidebarDate = '';
    let sidebarString = '';
    let sidebarObject = '';
    byViewCount.sort((a, b) => b.data().view_count - a.data().view_count);
    byViewCount.slice(0, 3);
    byViewCount.forEach((doc) => {
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
    const newViewCount = article.data().view_count + 1;
    let articleObject = '';
    const articleId = '{' + '"id"' + ':' + JSON.stringify(article.id) + '}';
    const articleString = JSON.stringify(article.data());
    const articleDate = article.get('publish_date');
    let formattedDate = articleDate.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    formattedDate = '{' + '"date"' + ':' + JSON.stringify(formattedDate) + '}';
    articleObject += articleId + formattedDate + articleString;
    articleObject = articleObject.replace(/}{/g, ',');
    articleObject = JSON.parse(articleObject);
    articleRef.update({view_count: newViewCount});
    res.render('article', {
      shareurl: shareUrl,
      sharedescription: shareDescriptionFormatted,
      article: articleObject,
      sidebar: sidebarObject,
      next: nextArticleObject,
      bannedList: bannedList,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

module.exports = router;
