const admin = require('firebase-admin');
const db = admin.firestore();

const express = require('express');
const router = new express.Router();
const utils = require('./utils');

router.get('/', async (req, res) => {
  let sidebarId = '';
  let sidebarDate = '';
  let sidebarString = '';
  let sidebarObject = '';
  let articlesId = '';
  let articlesDate = '';
  let articlesString = '';
  let articlesObject = '';
  const featuredPostsEndDate = new Date(new Date().setDate(new Date().getDate() - 90));
  const tagList = utils.getTagList;
  const articles = db.collection('articles');
  try {
    const recentArticles = await articles.where('publish_date', '>=', featuredPostsEndDate).get();
    let byViewCount = recentArticles.docs.slice();
    let byPublishDate = recentArticles.docs.slice();
    byViewCount.sort((a, b) => b.data().view_count - a.data().view_count);
    byViewCount = byViewCount.slice(0, 3);
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
    byPublishDate.reverse((a, b) => a.data().publish_date - b.data().publish_date);
    byPublishDate = byPublishDate.slice(0, 5);
    byPublishDate.forEach((doc) => {
      articlesId = '{' + '"id"' + ':' + JSON.stringify(doc.id) + '}';
      articlesDate = doc.get('publish_date');
      const date = articlesDate.toDate();
      let month = date.toLocaleString('en-US', {month: 'short'});
      let day = date.toLocaleString('en-US', {day: 'numeric'});
      month = '{' + '"month"' + ':' + JSON.stringify(month) + '}';
      day = '{' + '"day"' + ':' + JSON.stringify(day) + '}';
      articlesString = JSON.stringify(doc.data());
      articlesObject += articlesId + month + day + articlesString;
      articlesObject = articlesObject.replace(/}{/g, ',');
      articlesObject = articlesObject + ',';
    });
    articlesObject = articlesObject.replace(/,*$/, '');
    articlesObject = JSON.parse('[' + articlesObject + ']');
    res.render('home', {
      articles: articlesObject,
      sidebars: sidebarObject,
      headlines: 'active',
      tagList,
    });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
