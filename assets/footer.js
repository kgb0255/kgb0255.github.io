// Injects the shared site footer into <div id="site-footer"></div>.
(function () {
  var placeholder = document.getElementById('site-footer');
  if (!placeholder) return;

  placeholder.outerHTML =
    '<footer>&copy; 2026 James Kwon | Last updated on <span id="last-updated"></span></footer>';

  var d = new Date(document.lastModified);
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById('last-updated').textContent = months[d.getMonth()] + ' ' + d.getDate() + ' ' + d.getFullYear();
})();
