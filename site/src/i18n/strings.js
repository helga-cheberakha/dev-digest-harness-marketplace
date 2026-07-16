// Single source for every piece of UI copy in the catalog app. Components
// import `strings` rather than embedding literal text, so the whole app's
// copy — and eventually its translations — lives in one place.

export const strings = {
  brand: {
    name: "dev-digest-harness",
    tagline: "marketplace",
  },
  nav: {
    home: "Home",
    catalog: "Catalog",
    dependencies: "Dependencies",
  },
  header: {
    unitsSuffix: "units",
    subscribe: "Subscribe",
    subscribeTitle: "RSS feed of changelog entries",
  },
  home: {
    fallbackTagline: "A Claude Code plugin marketplace — reusable skills, agents, and workflows, ready to install.",
    installTitle: "Install the marketplace (once)",
    installHint:
      "Run this once per machine to register the marketplace. After that, install any plugin below with its own copy-pasteable command.",
    installStepTwoLabel: "Then install a plugin",
    installStepTwoHint: "Copy the install command from any card in the",
    installStepTwoLink: "catalog",
    statsTitle: "What's inside",
    statsPlugins: "Plugins",
    statsSkills: "Skills",
    statsAgents: "Agents",
    statsCategories: "Categories",
    updatesTitle: "Latest updates",
    updatesEmpty: "No changelog entries yet.",
    updatesViewAll: "View all in catalog →",
    browseTitle: "Browse",
    browseCatalogTitle: "Search the catalog",
    browseCatalogDesc: "Filter by type, category, status, or author — or search by what you need.",
    browseCatalogCta: "Open catalog →",
    browseGraphTitle: "Dependency graph",
    browseGraphDesc: "See which plugins depend on which, generated straight from the registered data.",
    browseGraphCta: "View graph →",
    goodToKnowTitle: "Good to know",
    updatingCatalogLabel: "Refresh the catalog",
    updatingCatalogCmd: "/plugin marketplace update",
    updatingCatalogDesc: "Pulls the list of available plugins/versions. Does not update installed plugins.",
    updatingInstalledLabel: "Update an installed plugin",
    updatingInstalledDesc: "updates one already-installed plugin to a new version.",
    generatedAtPrefix: "Catalog data generated",
    repository: "Repository",
    contributing: "Contributing guide",
    license: "License",
  },
  search: {
    placeholder: "Search plugins, skills, and agents — describe what you need…",
    clear: "Clear search",
  },
  facets: {
    groupLabels: {
      type: "Type",
      category: "Category",
      status: "Status",
      author: "Author",
    },
    clearAll: "Clear all filters",
  },
  categoryLabels: {
    "engineering-skills": "Engineering",
    research: "Research",
    review: "Review",
    workflow: "Workflow",
  },
  statusLabels: {
    released: "Released",
    "in-progress": "In progress",
    planned: "Planned",
  },
  card: {
    partOf: "part of",
    viewDetails: "View details →",
  },
  results: {
    result: "result",
    results: "results",
    sortedByRelevance: "sorted by relevance",
    pluginsFirst: "plugins first",
    noMatchesTitle: "No matches",
    noMatchesDesc: "Nothing matches your search and filters.",
    resetAll: "Reset search & filters",
  },
  graph: {
    title: "Dependency graph",
    introBefore: "Generated straight from each plugin's registered",
    introCode: "dependencies",
    introAfter: "— arrows point from a plugin to what it requires. Click any node to open its detail page.",
    noDependencies: "no dependencies",
    dependency: "dependency",
    dependencies: "dependencies",
  },
  detail: {
    back: "← Back to catalog",
    notFound: "Plugin not found.",
    dependsOn: "Depends on",
    by: "by",
    homepage: "homepage",
    repository: "repository",
    readme: "Readme",
    readmeLoading: "Loading…",
    readmeEmpty: "No README.",
    tools: "tools:",
    changelog: "Changelog",
  },
  loading: {
    title: "Loading catalog…",
    errorTitle: "Couldn't load the catalog",
    errorDesc: "The catalog data failed to load. Try refreshing the page.",
  },
  copy: {
    copy: "Copy",
    copied: "Copied!",
    copyBadge: "Copy badge",
  },
  footer: {
    note: "Static · GitHub Pages · no backend",
  },
};

export function statusLabel(status) {
  return strings.statusLabels[status] ?? status;
}

export function categoryLabel(category) {
  return strings.categoryLabels[category] ?? category;
}

export function dependencyCountText(count) {
  if (count === 0) return strings.graph.noDependencies;
  const word = count === 1 ? strings.graph.dependency : strings.graph.dependencies;
  return `${count} ${word}`;
}

export function resultCountNoun(count) {
  return count === 1 ? strings.results.result : strings.results.results;
}
