(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;
  var current = aside.dataset.current || '';

  var posts = [
    { href: 'welcome.html' },
    { href: '21-lessons.html', category: 'Books' }
    // { href: 'book-title.html', category: 'Books' }
  ];

  Promise.all(posts.map(function (p) {
    var id = p.href.replace(/\.html$/, '');
    return fetch(p.href)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var h1 = doc.querySelector('main h1');
        return { id: id, href: p.href, category: p.category, label: h1 ? h1.textContent.trim() : p.href };
      });
  })).then(function (posts) {
    function renderPost(p) {
      if (p.id === current) {
        return '<li class="tree-current">' + p.label + '</li>';
      }
      return '<li><a href="' + p.href + '">' + p.label + '</a></li>';
    }

    var categories = [];
    var uncategorized = [];
    posts.forEach(function (p) {
      if (p.category) {
        if (categories.indexOf(p.category) === -1) categories.push(p.category);
      } else {
        uncategorized.push(p);
      }
    });

    var html = '<a href="../blog.html" class="tree-root">Blog Main</a><ul>';

    uncategorized.forEach(function (p) {
      html += renderPost(p);
    });

    categories.forEach(function (cat) {
      var inCat = posts.filter(function (p) { return p.category === cat; });
      var hasCurrent = inCat.some(function (p) { return p.id === current; });
      html += '<li><details' + (hasCurrent ? ' open' : '') + '><summary>' + cat + '</summary><ul>';
      inCat.forEach(function (p) { html += renderPost(p); });
      html += '</ul></details></li>';
    });

    html += '</ul>';
    aside.innerHTML = html;
  });
})();
