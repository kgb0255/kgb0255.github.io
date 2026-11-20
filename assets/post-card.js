async function renderPostCards(containerId, posts, defaultOpenIndex) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var cards = await Promise.all(posts.map(function (p) {
    return fetch(p.href)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var h1 = doc.querySelector('main h1');
        var excerptEl = doc.querySelector('main p:not(.meta)');
        var excerpt = excerptEl ? excerptEl.textContent.trim().replace(/\s+/g, ' ') : '';
        if (excerpt.length > 180) {
          excerpt = excerpt.slice(0, 180).replace(/\s+\S*$/, '') + '…';
        }
        // Thumbnail: the post's `thumb` from posts-data.js if given, otherwise the
        // first photo in the post. `thumb: false` turns it off.
        var thumb = '';
        if (p.thumb) {
          thumb = new URL(p.thumb, new URL('assets/', document.baseURI)).href;
        } else if (p.thumb !== false) {
          var firstImg = doc.querySelector('main img');
          if (firstImg && firstImg.getAttribute('src')) {
            thumb = new URL(firstImg.getAttribute('src'), new URL(p.href, document.baseURI)).href;
          }
        }
        return {
          thumb: thumb,
          href: p.href,
          category: p.category,
          date: p.date,
          title: h1 ? h1.textContent.trim() : p.href,
          excerpt: excerpt
        };
      });
  }));

  container.innerHTML = cards.map(function (post, i) {
    var badge = post.category ? '<span class="tag-badge">' + post.category + '</span>' : '';
    var openAttr = i === defaultOpenIndex ? ' open' : '';
    return (
      '<div class="card">' +
        '<details' + openAttr + '>' +
          '<summary' + (post.thumb ? ' class="has-thumb"' : '') + '>' +
            '<div class="card-head"><h3>' + post.title + '</h3>' + badge +
            '<p class="meta no-indent">' + post.date + '</p></div>' +
            (post.thumb ? '<img class="card-thumb" src="' + post.thumb + '" alt="" loading="lazy">' : '') +
          '</summary>' +
          '<p>' + post.excerpt + '</p>' +
          '<p class="no-indent"><a href="' + post.href + '">Read more &rarr;</a></p>' +
        '</details>' +
      '</div>'
    );
  }).join('');
}
