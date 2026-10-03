// Interactive research graph: areas -> subsets -> [projects] -> papers.
// Requires d3 (v7), assets/projects-data.js and assets/research-graph-data.js.
// Paper metadata is read from the publication list already on the page (#publications-list),
// so it stays in sync with the weekly ADS update.
(function () {
  var root = document.getElementById('research-graph');
  if (!root || !window.d3) return;

  var svgEl = root.querySelector('svg');
  var panel = document.getElementById('graph-panel');
  var legend = root.querySelector('.graph-legend');
  var W = 760, H = 720;

  // ---- Build nodes and links --------------------------------------------------------------
  // Every node except an area has a `parent`; links run parent -> child.
  var nodes = [], links = [], byId = {};
  function addNode(n, parentId) {
    nodes.push(n); byId[n.id] = n;
    if (parentId) { n.parent = parentId; links.push({ source: parentId, target: n.id }); }
    return n;
  }

  var areaTargetX = {};
  (window.GRAPH_AREAS || []).forEach(function (a, i, all) {
    areaTargetX[a.id] = W * (i + 1) / (all.length + 1);
    addNode({ id: 'area:' + a.id, type: 'area', area: a.id, label: a.label, color: a.color, textColor: a.text || a.color });
  });
  (window.GRAPH_TOPICS || []).forEach(function (t) {
    var area = byId['area:' + t.area];
    if (area) addNode({ id: 'topic:' + t.id, type: 'topic', area: t.area, label: t.label, color: area.color, textColor: area.textColor }, area.id);
  });

  var siteProjects = {};
  (window.SITE_PROJECTS || []).forEach(function (p) { siteProjects[p.slug] = p; });
  (window.GRAPH_PROJECTS || []).forEach(function (p) {
    var topic = byId['topic:' + p.topic], site = siteProjects[p.slug];
    if (!topic || !site) return;
    addNode({ id: 'project:' + p.slug, type: 'project', area: topic.area, label: site.title || p.slug,
      slug: p.slug, color: topic.color, textColor: topic.textColor }, topic.id);
  });

  // Parent of a paper: its project if it has one, otherwise its subset.
  function parentOf(rule) {
    return byId['project:' + rule.project] ? 'project:' + rule.project : 'topic:' + rule.topic;
  }

  var items = document.querySelectorAll('#publications-list li');
  Array.prototype.forEach.call(items, function (li, i) {
    var lines = li.innerHTML.split(/<br\s*\/?>/i);
    var titleLine = (lines[1] || '').replace(/<[^>]+>/g, '');
    var title = titleLine.replace(/\.\s*[^.]*,\s*\d{4}\.\s*$/, '') || titleLine;
    var lower = title.toLowerCase();
    var yearMatch = titleLine.match(/(\d{4})\.\s*$/);
    var order = (lines[0] || '').split(',');   // "<strong>K. J. Kwon</strong>" marks my slot in the author list
    var lead = !/\(including/i.test(lines[0] || '') &&   // "X, et al. (including me)" is not a lead-author paper
      (/<strong>/i.test(order[0] || '') || /<strong>/i.test(order[1] || ''));

    var rule = (window.GRAPH_PAPERS || []).filter(function (r) {
      return r.match.some(function (m) { return lower.indexOf(m) !== -1; });
    })[0];
    var topic = rule && byId['topic:' + rule.topic];

    addNode({
      id: 'paper:' + i,
      type: 'paper',
      label: rule ? rule.label : (title.length > 28 ? title.slice(0, 26) + '…' : title),
      year: yearMatch ? yearMatch[1] : '',
      lead: lead,
      area: topic ? topic.area : null,
      color: topic ? topic.color : '#888',
      html: li.innerHTML
    }, topic ? parentOf(rule) : null);
  });

  (window.GRAPH_PLANNED || []).forEach(function (p, i) {
    var topic = byId['topic:' + p.topic];
    if (!topic) return;
    addNode({
      id: 'planned:' + i, type: 'paper', planned: true, label: p.label, year: 9999,
      area: topic.area, color: topic.color,
      also: (p.also || []).map(function (t) { return 'topic:' + t; }),
      html: '<em>' + p.label.replace(/\s*\(in prep\)\s*$/i, '') + '</em> &mdash; in preparation'
    }, parentOf(p));
  });

  // Drop areas/topics/projects that ended up with nothing attached.
  var used = {};
  links.forEach(function (l) { used[l.source] = used[l.target] = true; });
  nodes = nodes.filter(function (n) { return n.type === 'paper' || used[n.id]; });
  links = links.filter(function (l) { return byId[l.source] && byId[l.target]; });

  // Dashed "related topic" links. They only mark a connection across branches, so they stay out
  // of the force simulation and are drawn underneath everything else.
  var crossLinks = [];
  nodes.forEach(function (n) {
    (n.also || []).forEach(function (id) { if (byId[id]) crossLinks.push({ source: n, target: byId[id] }); });
  });

  // Everything "related" to a node (itself, its ancestors and its descendants), for hover
  // highlighting and the detail panel.
  function related(d) {
    var ids = {}; ids[d.id] = true;
    for (var a = d; a.parent && byId[a.parent]; a = byId[a.parent]) ids[a.parent] = true;
    (function down(id) {
      nodes.forEach(function (n) { if (n.parent === id) { ids[n.id] = true; down(n.id); } });
    })(d.id);
    return ids;
  }
  nodes.forEach(function (n) { n.rel = related(n); });
  crossLinks.forEach(function (l) { l.source.rel[l.target.id] = true; l.target.rel[l.source.id] = true; });

  // ---- Layout -----------------------------------------------------------------------------
  var radius = { area: 22, topic: 11, project: 12, paper: 5 };
  function r(n) { return n.type === 'paper' && n.lead ? 7 : radius[n.type]; }

  // Deterministic structural seed (area in the middle of its side, subsets around it, children
  // fanned out beyond their parent), so the graph looks the same on every load and the forces
  // only have to polish it.
  (function seed() {
    function children(n) { return nodes.filter(function (c) { return c.parent === n.id; }); }
    function fan(n, baseAngle, dist) {
      var cs = children(n);
      cs.forEach(function (c, k) {
        var ang = baseAngle + (k - (cs.length - 1) / 2) * 0.9;
        c.x = n.x + dist * Math.cos(ang); c.y = n.y + dist * Math.sin(ang);
        c.angle = ang;
        fan(c, ang, 90);
      });
    }
    nodes.forEach(function (n) {
      if (n.type !== 'area') return;
      n.x = areaTargetX[n.area]; n.y = H / 2;
      var ts = children(n);
      ts.forEach(function (t, i) {
        t.angle = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / ts.length;
        t.x = n.x + 150 * Math.cos(t.angle); t.y = n.y + 150 * Math.sin(t.angle);
        fan(t, t.angle, 90);
      });
    });
    nodes.forEach(function (n) { if (n.type === 'paper' && !n.area) { n.x = W / 2; n.y = H / 2; } });
  })();

  var sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(function (d) { return d.id; })
      .distance(function (l) { return l.source.type === 'area' ? 100 : 85; })
      .strength(0.8))
    .force('charge', d3.forceManyBody().strength(function (d) { return d.type === 'area' ? -700 : -240; }))
    .force('collide', d3.forceCollide().radius(function (d) {
      return r(d) + (d.type === 'paper' ? Math.min(52, 14 + d.label.length * 1.9) : d.label.length * 2.6 + 18);
    }).iterations(3))
    .force('x', d3.forceX(function (d) { return d.area ? areaTargetX[d.area] : W / 2; }).strength(function (d) { return d.area ? 0.05 : 0.02; }))
    .force('y', d3.forceY(H / 2).strength(0.02))
    .stop();

  function clampX(x) { return Math.max(95, Math.min(W - 95, x)); }
  function clampY(y) { return Math.max(28, Math.min(H - 34, y)); }
  // Clamp inside the simulation so collisions resolve within the bounds rather than piling up at the edges.
  for (var t = 0; t < 400; t++) {
    sim.tick();
    nodes.forEach(function (d) { d.x = clampX(d.x); d.y = clampY(d.y); });
  }

  // A force layout can park a node on a line it isn't part of, which reads as a false connection.
  // Nudge any such node sideways until it clears every foreign line.
  (function avoidLinks() {
    for (var pass = 0; pass < 80; pass++) {
      var moved = false;
      nodes.forEach(function (n) {
        links.concat(crossLinks).forEach(function (l) {
          var a = l.source, b = l.target;
          if (a === n || b === n) return;
          var dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
          if (!len2) return;
          var t = ((n.x - a.x) * dx + (n.y - a.y) * dy) / len2;
          if (t < 0.02 || t > 0.98) return;
          var ex = n.x - (a.x + t * dx), ey = n.y - (a.y + t * dy), d = Math.sqrt(ex * ex + ey * ey);
          var len = Math.sqrt(len2);
          var ux = d ? ex / d : -dy / len, uy = d ? ey / d : dx / len;   // away from the line
          // Clear the label as well as the dot: its half-width counts when the push is sideways.
          var need = 16 + r(n) + Math.abs(ux) * n.label.length * 2.7;
          if (d >= need) return;
          n.x = clampX(n.x + ux * (need - d)); n.y = clampY(n.y + uy * (need - d));
          moved = true;
        });
      });
      if (!moved) break;
    }
  })();

  // ---- Render -----------------------------------------------------------------------------
  var svg = d3.select(svgEl).attr('viewBox', '0 0 ' + W + ' ' + H);

  var cross = svg.append('g').attr('class', 'g-cross')   // first in the SVG = lowest z-order
    .selectAll('line').data(crossLinks).join('line')
    .style('stroke', function (d) { return d.source.color; });

  var link = svg.append('g').attr('class', 'g-links')
    .selectAll('line').data(links).join('line')
    .style('stroke', function (d) { return d.source.color; });

  var node = svg.append('g').attr('class', 'g-nodes')
    .selectAll('g').data(nodes).join('g')
    .attr('class', function (d) { return 'g-node g-' + d.type + (d.lead ? ' g-lead' : '') + (d.planned ? ' g-planned' : ''); })
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', function (d) { return d.type + ': ' + d.label; });

  node.each(function (d) {
    var g = d3.select(this);
    if (d.type === 'project') {
      g.append('rect').attr('x', -r(d)).attr('y', -r(d)).attr('width', 2 * r(d)).attr('height', 2 * r(d)).attr('rx', 3)
        .style('fill', d.color);
    } else {
      var c = g.append('circle').attr('r', r(d)).style('stroke', d.color);
      // Filled = area / lead-author paper; hollow = subset, or a paper where I'm a later author.
      c.style('fill', d.type === 'topic' ? '#fff' : (d.type === 'paper' && !d.lead ? '#fff' : d.color));
    }
    g.append('text').attr('dy', r(d) + 13).attr('text-anchor', 'middle')
      .style('fill', d.type === 'paper' ? null : d.textColor).text(d.label);
  });

  function position() {
    nodes.forEach(function (d) { d.x = clampX(d.x); d.y = clampY(d.y); });
    [link, cross].forEach(function (sel) {
      sel.attr('x1', function (d) { return d.source.x; }).attr('y1', function (d) { return d.source.y; })
         .attr('x2', function (d) { return d.target.x; }).attr('y2', function (d) { return d.target.y; });
    });
    node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  }
  position();
  sim.on('tick', position);

  node.call(d3.drag()
    .on('start', function (e, d) { if (!e.active) sim.alpha(0.25).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', function (e, d) { d.fx = clampX(e.x); d.fy = clampY(e.y); })
    .on('end', function (e, d) { if (!e.active) sim.alphaTarget(0); d.fx = d.fy = null; }));

  // ---- Legend (neutral shapes only; colours already identify the branches) ----------------
  if (legend) {
    var hasProject = nodes.some(function (n) { return n.type === 'project'; });
    var hasPlanned = nodes.some(function (n) { return n.planned; });
    var sw = function (css, text) { return '<span><i style="' + css + '"></i>' + text + '</span>'; };
    legend.innerHTML =
      sw('width:9px;height:9px;background:#777', 'Lead-author paper (1st/2nd)') +
      sw('width:7px;height:7px;border:2px solid #777;background:#fff', 'Contributed paper') +
      sw('width:12px;height:12px;border:3px solid #777;background:#fff', 'Topical arrangement') +
      (hasProject ? sw('width:10px;height:10px;border-radius:2px;background:#777', 'Lead project') : '') +
      (crossLinks.length ? sw('width:16px;height:0;border-top:2px dashed #777;border-radius:0;vertical-align:middle', 'Related topic') : '') +
      (hasPlanned ? sw('width:7px;height:7px;border:2px dashed #777;background:#fff', 'In preparation') : '') +
      '<span>Click a node for details &middot; drag to rearrange</span>';
  }

  // ---- Highlight + detail panel -----------------------------------------------------------
  var selected = null;

  function highlight(d) {
    var focus = d || selected;
    var rel = focus ? focus.rel : null;
    node.classed('g-dim', function (n) { return rel && !rel[n.id]; });
    [link, cross].forEach(function (sel) {
      sel.classed('g-dim', function (l) { return rel && !(rel[l.source.id] && rel[l.target.id]); })
         .classed('g-hot', function (l) { return rel && rel[l.source.id] && rel[l.target.id]; });
    });
    node.classed('g-selected', function (n) { return selected && n === selected; });
  }

  function showPanel(d) {
    var html;
    if (d.type === 'paper') {
      html = '<ul class="plain"><li>' + d.html + '</li></ul>';
    } else {
      var ps = nodes.filter(function (n) { return n.type === 'paper' && d.rel[n.id]; })
        .sort(function (a, b) { return b.year - a.year; });
      var head = '<p class="graph-panel-title" style="color:' + (d.textColor || d.color) + '"><strong>' + d.label + '</strong>' +
        (d.type === 'project' ? ' &mdash; <a href="projects/' + d.slug + '.html">Read more →</a>' : '') + '</p>';
      html = head + '<ul class="plain">' + ps.map(function (p) { return '<li>' + p.html + '</li>'; }).join('') + '</ul>';
    }
    panel.innerHTML = html;
    panel.hidden = false;
  }

  function select(d) {
    selected = (selected === d) ? null : d;
    if (selected) showPanel(selected); else panel.hidden = true;
    highlight(null);
  }

  node.on('mouseenter', function (e, d) { highlight(d); })
      .on('mouseleave', function () { highlight(null); })
      .on('focus', function (e, d) { highlight(d); })
      .on('blur', function () { highlight(null); })
      .on('click', function (e, d) { if (!e.defaultPrevented) select(d); })
      .on('keydown', function (e, d) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(d); } });

  root.hidden = false;
})();
