// Injects the shared site header into <div id="site-header"></div>.
// The relative-path base ('' at site root, '../' one level down) is derived
// from this script's own src, so it never needs to be duplicated per page.
(function () {
  var placeholder = document.getElementById('site-header');
  if (!placeholder) return;

  var base = document.currentScript.src.replace(/assets\/header\.js.*$/, '');

  placeholder.outerHTML =
    '<header>' +
      '<div class="header-bar"></div>' +
      '<div class="header-inner">' +
        '<a href="' + base + 'index.html" class="site-title">' +
          '<span class="title-main">K. J. Kwon</span>' +
        '</a>' +
        '<nav>' +
          '<ul>' +
            '<li><a href="' + base + 'index.html">Home</a></li>' +
            '<li><a href="' + base + 'research.html">Research</a></li>' +
            '<li><a href="' + base + 'cv.html">CV</a></li>' +
            '<li><a href="' + base + 'contact.html">Contact</a></li>' +
          '</ul>' +
        '</nav>' +
        '<a href="' + base + 'blog.html" class="nav-signature" aria-label="Blog"> </a>' +
      '</div>' +
    '</header>';
})();
