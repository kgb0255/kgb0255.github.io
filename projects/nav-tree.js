(function () {
  var aside = document.querySelector('.dir-tree');
  if (!aside) return;
  var current = aside.dataset.current || '';

  var projects = [
    { id: 'gmode',   label: 'Neutron-Star Stratification', href: 'gmode.html'   },
    { id: 'triplet', label: 'Triplet Interaction',          href: 'triplet.html' }
  ];

  var html = '<a href="../research.html" class="tree-root">Research Main</a><ul>';
  projects.forEach(function (p) {
    if (p.id === current) {
      html += '<li class="tree-current">' + p.label + '</li>';
    } else {
      html += '<li><a href="' + p.href + '">' + p.label + '</a></li>';
    }
  });
  html += '</ul>';

  aside.innerHTML = html;
})();
