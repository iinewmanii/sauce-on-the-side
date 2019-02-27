const infinite = function () {
  "use strict";
  const db = firebase.firestore();
  db.settings({
    timestampsInSnapshots: true
  });
  let articles = db.collection('articles');
  let isInfinite = true;
  let fetching = false;
  articles
    .where('publish', '==', true)
    .orderBy('publish_date', 'desc')
    .limit(5)
    .get()
    .then(function (snapshot) {
      let lastVisible = snapshot.docs[snapshot.docs.length - 1].get("publish_date");

      const infinite = function (lastVisible) {
        return articles.where('publish', '==', true).orderBy('publish_date', 'desc').startAfter(lastVisible).limit(5);
      }

      const infiniteScroll = function () {
        if (isInfinite && !fetching && ($(window).scrollTop() + $(window).height() > ($(document).height() / 4) * 3)) {
          fetching = true;
          infinite(lastVisible).get().then(function (snapshot) {
              snapshot.forEach(function (doc) {
                let data = doc.data();
                let articleDate = data.publish_date;
                let date = articleDate.toDate();
                let month = date.toLocaleString('en-US', {
                  month: 'short',
                });
                let day = date.toLocaleString('en-US', {
                  day: 'numeric',
                });
                $("#infinite-div").append(
                  "<div class='row no-gutters'>" +
                  "<div class='col d-none d-md-block col-md-1 col-lg-1 col-xl-1'>" +
                  "<div class='card card-shadow border-light text-center mr-3 mt-1'>" +
                  "<div>" +
                  "<h5 class='card-month'>" + month + "</h5>" +
                  "<h5 class='card-day'>" + day + "</h5>" +
                  "</div>" +
                  "</div>" +
                  "</div>" +
                  "<div class='col d-block col-sm-12 col-md-11 col-lg-11 col-xl-11'>" +
                  "<div class='card card-shadow card-border'>" +
                  "<a class='card-default-link' href='/articles/" + doc.id + "'></a>" +
                  "<div class='card-image-wrapper'>" +
                  "<img class='card-image lazy' src='" + data.lqip_image_download_url + "' data-src='" + data.image_download_url + "'" +
                  "alt='Image Not Found'>" +
                  "</div>" +
                  "<div class='card-body-over bg-white'>" +
                  "<h2 class='card-title'>" + data.title + "</h2>" +
                  "<p class='card-text'>" + data.body + "</p>" +
                  "</div>" +
                  "</div>" +
                  "</div>" +
                  "</div>"
                );
              });
              lastVisible = snapshot.docs[snapshot.docs.length - 1].get("publish_date");
              fetching = false;
            })
            .catch(function (error) {
              isInfinite = false;
              $("#infinite-div").append(
                "<div class='d-flex flex-row flex-fill align-items-center justify-content-center h-10'><p>We Ran Out Of Articles...</p></div>"
              );
            });
        }
      }

      $(document).on('scroll', infiniteScroll);
      $(document.body).on('touchmove', infiniteScroll);
    })
    .catch(function (error) {
      return;
    });
}
document.addEventListener('DOMContentLoaded', infinite);