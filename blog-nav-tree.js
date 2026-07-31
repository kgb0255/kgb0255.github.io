(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;

  var posts = [
    { href: 'posts/welcome.html' },
    { href: 'posts/21-lessons.html', category: 'Books' }
    // { href: 'posts/book-title.html', category: 'Books' }
  ];

  Promise.all(posts.map(function (p) {
    return fetch(p.href)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var h1 = doc.querySelector('main h1');
        return { href: p.href, category: p.category, label: h1 ? h1.textContent.trim() : p.href };
      });
  })).then(function (posts) {
    var categories = [];
    var uncategorized = [];
    posts.forEach(function (p) {
      if (p.category) {
        if (categories.indexOf(p.category) === -1) categories.push(p.category);
      } else {
        uncategorized.push(p);
      }
    });

    var html = '<a href="blog.html" class="tree-root tree-current">Blog Main</a><ul>';

    uncategorized.forEach(function (p) {
      html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
    });

    categories.forEach(function (cat) {
      html += '<li><details><summary>' + cat + '</summary><ul>';
      posts.filter(function (p) { return p.category === cat; }).forEach(function (p) {
        html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
      });
      html += '</ul></details></li>';
    });

    html += '</ul>';
    aside.innerHTML = html;
  });
})();
