(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;
  var current = aside.dataset.current || '';

  var posts = [
    { id: 'welcome', label: 'Welcome', href: 'welcome.html' }
  ];

  var html = '<a href="../blog.html" class="tree-root">Blog Main</a><ul>';
  posts.forEach(function (p) {
    if (p.id === current) {
      html += '<li class="tree-current">' + p.label + '</li>';
    } else {
      html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
    }
  });
  html += '</ul>';

  aside.innerHTML = html;
})();
