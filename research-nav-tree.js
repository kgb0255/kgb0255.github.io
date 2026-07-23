(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;

  var projects = [
    { label: 'Neutron-Star Stratification', href: 'projects/gmode.html'   },
    { label: 'Triplet Interaction',          href: 'projects/triplet.html' }
  ];

  var html = '<a href="research.html" class="tree-root tree-current">Research Main</a><ul>';
  projects.forEach(function (p) {
    html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
  });
  html += '</ul>';

  aside.innerHTML = html;
})();
