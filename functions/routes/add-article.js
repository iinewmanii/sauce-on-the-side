const admin = require('firebase-admin');

const express = require('express');
const router = new express.Router();
const Busboy = require('busboy');
const sharp = require('sharp');
const {auth, getTagList} = require('./utils');

const db = admin.firestore();

const storageBucket = admin.storage().bucket();

const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

router.get('/add-article', auth, (req, res) => {
  const tagList = getTagList;
  res.render('add-article', {tagList});
});

router.post('/add-article', (req, res) => {
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
  busboy.on('finish', () => {
    if (req.files[0] != null) {
      const id = req.body.title.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, '').replace(/\s/g, '-').toLowerCase();
      const file = storageBucket.file('article-images/' + id);
      const fileLqip = storageBucket.file('article-images/' + id + '-lqip');
      let lqipUrl = '';
      let lqipStrgUrl = '';
      sharp(req.files[0].buffer)
          .removeAlpha()
          .resize({height: 100})
          .blur(3)
          .jpeg({quality: 100, chromaSubsampling: '4:2:0'})
          .toBuffer()
          .then((data) => {
            fileLqip.save(data).then(() => {
              fileLqip.getSignedUrl({action: 'read', expires: '03-14-2491'}, (err, url) => {
                if (err) {
                  return;
                }
                lqipUrl = url;
                fileLqip.getMetadata((err, data) => {
                  if (err) {
                    return;
                  }
                  lqipStrgUrl = data.id;
                  sharp(req.files[0].buffer)
                      .removeAlpha()
                      .jpeg({quality: 90, chromaSubsampling: '4:4:4'})
                      .toBuffer()
                      .then((data) => {
                        file.save(data).then(() => {
                          file.getSignedUrl({action: 'read', expires: '03-14-2491'}, (err, url) => {
                            if (err) {
                              return;
                            }
                            file.getMetadata((err, data) => {
                              if (err) {
                                return;
                              }
                              const makeItObject = {};
                              let makeIt = req.body.makeit;
                              makeIt = makeIt.split(', ').map((s) => s.split(': '));
                              makeIt.forEach((element) => {
                                makeItObject[element[0]] = element[1];
                              });
                              console.log('NEWMAN', makeItObject);
                              const publish = Boolean(Number(req.body.publish));
                              const article = db.collection('articles').doc(id);
                              article.set({
                                title: req.body.title,
                                author: req.body.author,
                                body: req.body.body,
                                lqip_image_storage_url: lqipStrgUrl,
                                lqip_image_download_url: lqipUrl,
                                image_storage_url: data.id,
                                image_download_url: url,
                                date_created: serverTimestamp,
                                tags: req.body.tags,
                                make_it: makeItObject,
                                publish: publish,
                                view_count: 0,
                              }).then((ref) => {
                                if (publish) {
                                  article.update({publish_date: serverTimestamp});
                                }
                                res.redirect('/');
                              });
                            });
                          });
                        });
                      });
                });
              });
            });
          }).catch((err) => {
            if (err) {
              return;
            }
          });
    } else {
      const makeItObject = {};
      let makeIt = req.body.makeit;
      makeIt = makeIt.split(', ').map((s) => s.split(': '));
      makeIt.forEach((element) => {
        makeItObject[element[0]] = element[1];
      });
      console.log('NEWMAN', makeItObject);
      const publish = Boolean(Number(req.body.publish));
      const article = db.collection('articles').doc(id);
      article.set({
        title: req.body.title,
        author: req.body.author,
        body: req.body.body,
        image_download_url: url,
        date_created: serverTimestamp,
        tags: req.body.tags,
        make_it: makeItObject,
        publish: publish,
        view_count: 0,
      }).then((ref) => {
        if (publish) {
          article.update({publish_date: serverTimestamp});
        }
        res.redirect('/');
      });
    }
  });
  busboy.end(req.rawBody);
});

module.exports = router;
