// Renders a list of publications into a <ul class="plain"> using the same
// markup/style as the Publications list on research.html.
// Usage: renderPublications('related-papers', [ {authors, title, journal, year, ads, arxiv} ], '../assets/')
function renderPublications(containerId, papers, iconBase) {
  iconBase = iconBase || 'assets/';
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = papers.map(function (p) {
    var ads = p.ads
      ? '<a href="' + p.ads + '" target="_blank" rel="noopener"><img src="' + iconBase +
        'ads_partial_logo_dark_background.svg" alt="NASA ADS" style="height:16px; vertical-align:middle; margin-right:6px;"></a>'
      : '';
    var arxiv = p.arxiv
      ? '<a href="' + p.arxiv + '" target="_blank" rel="noopener"><img src="' + iconBase +
        'arxiv-logo.svg" alt="arXiv" style="height:16px; vertical-align:middle;"></a>'
      : '';

    return '<li>' +
      p.authors + '<br>' +
      p.title + '. <em>' + p.journal + '</em>, ' + p.year + '.<br>' +
      ads + arxiv +
      '</li>';
  }).join('');
}
