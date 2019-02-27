const admin = require('firebase-admin');

const express = require('express');
const router = new express.Router();
const Busboy = require('busboy');
const sharp = require('sharp');
const {auth, getTagList} = require('./utils');

const db = admin.firestore();

const storageBucket = admin.storage().bucket();

const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

router.get('/edit-article', auth, async (req, res) => {
  try {
    const articles = await db.collection('articles').get();
    let articlesList = '';
    articles.forEach((doc) => {
      articlesList += '{' + '"id"' + ':' + JSON.stringify(doc.id) + '}';
    });
    articlesList = articlesList.replace(/}{/g, '},{');
    articlesList = JSON.parse('[' + articlesList + ']');
    res.render('edit-article', {articles: articlesList});
  } catch (err) {
    res.redirect('/');
  }
});

router.get('/edit-article/:id', async (req, res) => {
  try {
    const article = await db.collection('articles').doc(req.params.id).get();
    let articleId = '';
    let articleString = '';
    let articleObject = '';
    let publish = article.data().publish;
    const tagList = getTagList;
    publish = Number(publish).toString();
    articleId = '{' + '"id"' + ':' + JSON.stringify(article.id) + '}';
    articleString = JSON.stringify(article.data());
    articleObject += articleId + articleString;
    articleObject = articleObject.replace(/}{/g, ',');
    articleObject = JSON.parse(articleObject);
    res.render('edit-article-form', {articleObject, publish, tagList});
  } catch (err) {
    res.redirect('/edit-article');
  }
});

router.post('/edit-article/:id', async (req, res) => {
  const busboy = new Busboy({headers: req.headers});
  req.files = [];
  busboy.on('field', (fieldname, value) => {
    if (!req.body) req.body = {};
    if (!req.body.tags) req.body.tags = [];
    if (fieldname == 'tags') {
      req.body.tags.push(value);
    } else {
      req.body[fieldname] = value;
    }
  });
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    let fileBuffer;
    file.on('data', (data) => {
      fileBuffer = data;
    });
    file.on('end', () => req.files.push({
      fieldname,
      originalname: filename,
      encoding,
      mimetype,
      buffer: fileBuffer,
    }));
  });
  busboy.on('finish', async () => {
    try {
      const article = await db.collection('articles').doc(req.params.id).get();
      const keyIsPresent = article.data().hasOwnProperty('publish_date');
      const publish = Boolean(Number(req.body.publish));
      const imageRef = article.data().hasOwnProperty('image_storage_url');
      const file = storageBucket.file('article-images/' + req.params.id);
      const fileLqip = storageBucket.file('article-images/' + req.params.id + '-lqip');
      const updateArticleWithImage = async () => {
        if (req.files[0].buffer) {
          try {
            let signedUrlLqip;
            let storageMetadataLqip;
            let signedUrlArticleImage;
            let storageMetadataArticleImage;
            const articleImageLqip = await sharp(req.files[0].buffer).removeAlpha().resize({height: 100}).blur(3)
                .jpeg({quality: 100, chromaSubsampling: '4:2:0'}).toBuffer();
            const articleImage = await sharp(req.files[0].buffer).removeAlpha()
                .jpeg({quality: 90, chromaSubsampling: '4:4:4'}).toBuffer();
            await fileLqip.save(articleImageLqip, () => {
              fileLqip.getSignedUrl({action: 'read', expires: '03-14-2491'}).then((url) => {
                signedUrlLqip = url[0];
                fileLqip.getMetadata().then((data) => {
                  storageMetadataLqip = data[0].id;
                  file.save(articleImage, () => {
                    file.getSignedUrl({action: 'read', expires: '03-14-2491'}).then((url) => {
                      signedUrlArticleImage = url[0];
                      file.getMetadata().then((data) => {
                        storageMetadataArticleImage = data[0].id;
                        const makeItObject = {};
                        let makeIt = req.body.makeit;
                        makeIt = makeIt.split(', ').map((s) => s.split(': '));
                        makeIt.forEach((element) => {
                          makeItObject[element[0]] = element[1];
                        });
                        db.collection('articles').doc(req.params.id).update({
                          title: req.body.title,
                          author: req.body.author,
                          body: req.body.body,
                          lqip_image_storage_url: storageMetadataLqip,
                          lqip_image_download_url: signedUrlLqip,
                          image_storage_url: storageMetadataArticleImage,
                          image_download_url: signedUrlArticleImage,
                          publish: publish,
                          tags: req.body.tags,
                          make_it: makeItObject,
                        });
                      });
                    });
                  });
                });
              });
            });
          } catch (err) {
            console.error(err);
          }
        }
      };
      const addPublishDate = async () => {
        return await db.collection('articles').doc(req.params.id).update({publish_date: serverTimestamp});
      };
      const deletePublishDate = async () => {
        return await db.collection('articles').doc(req.params.id).update({publish_date: admin.firestore.FieldValue.delete()});
      };
      const handlePublishDate = async () => {
        if (publish && !keyIsPresent) {
          addPublishDate();
          res.redirect('/');
        } else if (!publish && keyIsPresent) {
          deletePublishDate();
          res.redirect('/');
        } else {
          res.redirect('/');
        }
      };
      if (!imageRef && req.files[0].originalname != '') {
        updateArticleWithImage();
        handlePublishDate();
      } else if (imageRef && req.files[0].originalname != '') {
        await fileLqip.delete();
        await file.delete();
        updateArticleWithImage();
        handlePublishDate();
      } else {
        const makeItObject = {};
        let makeIt = req.body.makeit;
        makeIt = makeIt.split(', ').map((s) => s.split(': '));
        makeIt.forEach((element) => {
          makeItObject[element[0]] = element[1];
        });
        db.collection('articles').doc(req.params.id).update({
          title: req.body.title,
          author: req.body.author,
          body: req.body.body,
          publish: publish,
          tags: req.body.tags,
          make_it: makeItObject,
        }).then((ref) => {
          handlePublishDate();
        });
      }
    } catch (err) {
      console.error(err);
      res.redirect('/edit-article');
    }
  });
  busboy.end(req.rawBody);
});

module.exports = router;
