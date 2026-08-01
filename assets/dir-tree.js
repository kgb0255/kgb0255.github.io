// Shared sidebar directory-tree renderer for both the Research -> Projects
// and Blog -> Posts sidebars, on both the collection index page and each
// item's own page.
//
// Usage: renderDirTree({ rootLabel, rootHref, items, basePath, current })
//   items:    [{ slug, title?, category?, date? }, ...] (e.g. window.SITE_POSTS)
//   basePath: path prefix to each item's page relative to the current page
//             (e.g. 'posts/' from blog.html, '' from within posts/*.html)
//   current:  slug of the page currently being viewed, if any (omit on the
//             collection index page itself)
//
// Item labels default to the item's real <h1> (fetched from its page), so a
// title only has to be written once. If an item's full title is too long to
// read comfortably in the narrow sidebar, give it a short `title` override
// in its data entry (posts-data.js / projects-data.js) — that skips the
// fetch and is used as the sidebar label directly.
function renderDirTree(opts) {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;

  var rootLabel = opts.rootLabel;
  var rootHref = opts.rootHref;
  var items = opts.items || [];
  var basePath = opts.basePath || '';
  var current = opts.current || '';

  Promise.all(items.map(function (item) {
    var href = basePath + item.slug + '.html';
    if (item.title) {
      return Promise.resolve({
        slug: item.slug,
        href: href,
        category: item.category,
        label: item.title
      });
    }
    return fetch(href)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var h1 = doc.querySelector('main h1');
        return {
          slug: item.slug,
          href: href,
          category: item.category,
          label: h1 ? h1.textContent.trim() : item.slug
        };
      });
  })).then(function (resolved) {
    function renderItem(p) {
      if (p.slug === current) {
        return '<li class="tree-current">' + p.label + '</li>';
      }
      return '<li><a href="' + p.href + '">' + p.label + '</a></li>';
    }

    var categories = [];
    var uncategorized = [];
    resolved.forEach(function (p) {
      if (p.category) {
        if (categories.indexOf(p.category) === -1) categories.push(p.category);
      } else {
        uncategorized.push(p);
      }
    });

    var rootClass = current ? 'tree-root' : 'tree-root tree-current';
    var html = '<a href="' + rootHref + '" class="' + rootClass + '">' + rootLabel + '</a><ul>';

    uncategorized.forEach(function (p) { html += renderItem(p); });

    categories.forEach(function (cat) {
      var inCat = resolved.filter(function (p) { return p.category === cat; });
      var hasCurrent = inCat.some(function (p) { return p.slug === current; });
      html += '<li><details' + (hasCurrent ? ' open' : '') + '><summary>' + cat + '</summary><ul>';
      inCat.forEach(function (p) { html += renderItem(p); });
      html += '</ul></details></li>';
    });

    html += '</ul>';
    aside.innerHTML = html;
  });
}
