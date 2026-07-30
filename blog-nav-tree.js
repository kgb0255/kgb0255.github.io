(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;

  var posts = [
    { label: 'Welcome', href: 'posts/welcome.html' }
  ];

  var html = '<a href="blog.html" class="tree-root tree-current">Blog Main</a><ul>';
  posts.forEach(function (p) {
    html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
  });
  html += '</ul>';

  aside.innerHTML = html;
})();
