// Curated structure for the Research graph (assets/research-graph.js).
//
// Hierarchy:  AREA  ->  SUBSET (topic)  ->  [project]  ->  paper.  An area, its subsets, projects
// and papers all share the area's colour. Areas are laid out left to right in the order listed.
//
// Paper metadata (title, authors, journal, links) is NOT stored here — the graph reads it from
// the ADS-generated publication list on the page, so new papers and journal updates show up
// automatically. This file only says where each paper belongs.
//
// To add an area/subset: add to GRAPH_AREAS / GRAPH_TOPICS. An area's optional `text` colour is a
//                        darker shade used only for label text (use it when `color` is light).
// To add a project:      add to GRAPH_PROJECTS (`slug` from assets/projects-data.js, `topic` = the
//                        subset it hangs under). Its label and page link come from SITE_PROJECTS.
// To place a paper:      add to GRAPH_PAPERS. `match` is one or more lowercase substrings of the
//                        paper's title (titles and bibcodes change between arXiv and the journal,
//                        so titles are the most stable key). `label` is the short name on the
//                        graph; `topic` is a subset id; `project` (optional) hangs the paper under
//                        that project instead of directly under the subset.
// To list unpublished work: add to GRAPH_PLANNED (shown as a dashed node, no ADS entry needed).
//                        `also: ['ndt']` adds a dashed link to another subset (drawn beneath everything).
// Papers with no GRAPH_PAPERS entry still appear, unlinked, so nothing is silently dropped.

window.GRAPH_AREAS = [
  { id: 'ai',      label: 'AI & Astrophysics', color: '#ac6f6f', text: '#8c4d4d' },
  { id: 'compact', label: 'Neutron-Star Tides', color: '#344b5b' }
];

window.GRAPH_TOPICS = [
  { id: 'imaging',  area: 'ai',      label: 'Image Processing' },
  { id: 'lensing',  area: 'ai',      label: 'Strong Lensing Detection' },
  { id: 'galaxies', area: 'ai',      label: 'Galaxy Modeling' },
  { id: 'ndt',      area: 'compact', label: 'Nonlinear Dynamical Tides' },
  { id: 'grt',      area: 'compact', label: 'General Relativistic Tides' }
];

window.GRAPH_PROJECTS = [
  { slug: 'gmode',   topic: 'ndt' },
  { slug: 'triplet', topic: 'grt' }
];

window.GRAPH_PAPERS = [
  // Neutron-Star Tides / Nonlinear Dynamical Tides
  { match: ['resonance locking: radian'],       label: 'Resonance locking 2025',  topic: 'ndt', project: 'gmode' },
  { match: ['resonance locking of anharmonic'], label: 'Anharmonic g-modes 2024', topic: 'ndt', project: 'gmode' },
  { match: ['beyond the linear tide'],          label: 'Nonlinear tide 2023',     topic: 'ndt' },
  { match: ['nonlinear hydrodynamics in spinning'], label: 'Spinning stars 2026', topic: 'ndt' },

  // Neutron-Star Tides / General Relativistic Tides
  { match: ['relativistic and dynamical love'], label: 'Love numbers 2026',       topic: 'grt' },
  { match: ['relativistic mode sums'],          label: 'Mode sums 2026',          topic: 'grt' },

  // AI & Astrophysics / Strong Lensing Detection
  { match: ['strong gravitational lenses'],     label: 'Lenses in DR9 2024',      topic: 'lensing' },
  { match: ['strong lens foundry. i.'],         label: 'Lens Foundry I 2026',     topic: 'lensing' },
  { match: ['strong lens foundry ii'],          label: 'Lens Foundry II 2025',    topic: 'lensing' },
  { match: ['strong lens foundry. iii'],        label: 'Lens Foundry III 2026',   topic: 'lensing' },

  // AI & Astrophysics / Galaxy Modeling
  { match: ['kinematics of central and satellite'], label: 'Galaxy kinematics 2024', topic: 'galaxies' },
  { match: ['hierarchy of normalizing flows'],  label: 'Flow hierarchy 2023',     topic: 'galaxies' },
  { match: ['provabgs'],                        label: 'PROVABGS 2023',           topic: 'galaxies' },
  { match: ['neural stellar population'],       label: 'Neural SPS 2023',         topic: 'galaxies' },

  // AI & Astrophysics / Image Processing
  { match: ['deepcr on acs/wfc'],               label: 'deepCR RNAAS 2021',       topic: 'imaging' },
  { match: ['deepcr-acs/wfc'],                  label: 'deepCR AAS 2021',         topic: 'imaging' }
];

window.GRAPH_PLANNED = [
  { label: 'Spectral Simulation (in prep)',    topic: 'ndt' },
  { label: 'Nonlinear Perturbation (in prep)', topic: 'grt', project: 'triplet', also: ['ndt'] }
];
