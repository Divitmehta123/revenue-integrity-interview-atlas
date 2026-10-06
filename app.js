/* Static, local-only reader. Source text is escaped, never interpreted as HTML. */
(() => {
  "use strict";
  const workbook = window.INTERVIEW_WORKBOOK;
  const main = document.getElementById("main");
  if (!workbook) {
    main.innerHTML =
      "<h1>The archive did not load</h1><p>Keep the data folder next to index.html, then reopen the reader. You can also download the original Excel workbook from the header.</p>";
    return;
  }
  const sheets = Object.fromEntries(workbook.sheets.map((s) => [s.name, s]));
  const people = sheets.Personas.rows;
  const interviews = sheets.Interviews.rows;
  const verdicts = new Map(sheets.Verdicts.rows.map((r) => [r[0], r]));
  const interviewsByPerson = new Map(
    people.map((p) => [p[0], interviews.filter((r) => r[0] === p[0])]),
  );
  const questions = interviews
    .filter((r) => r[0] === 0 && r[4] === "Initial")
    .map((r) => ({ id: r[5], text: r[7] }));
  const escape = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const exact = (value, cls = "") =>
    `<p class="exact ${cls}">${escape(value)}</p>`;
  const firstName = (person) => person[1].split(" (")[0];
  const personUrl = (id, tab = "interview", q = "") =>
    `#agent=${id}&tab=${tab}${q ? "&q=" + encodeURIComponent(q) : ""}`;
  const groupParts = (rows, textIndex) => {
    const groups = new Map();
    for (const row of rows) {
      if (!groups.has(row[0])) groups.set(row[0], []);
      groups.get(row[0]).push(row);
    }
    return [...groups].map(([id, parts]) => ({
      id,
      row: parts[0],
      text: parts
        .sort((a, b) => a[1] - b[1])
        .map((r) => r[textIndex])
        .join(""),
    }));
  };
  const sources = groupParts(sheets.Sources.rows, 8);
  const sourcesById = new Map(sources.map((s) => [s.id, s]));
  const sourceMessages = new Map();
  for (const row of sheets.Prompts.rows.filter(
    (r) => r[1] === "Message text",
  )) {
    if (!sourceMessages.has(row[0])) sourceMessages.set(row[0], []);
    sourceMessages.get(row[0]).push(row);
  }
  const messages = new Map(
    [...sourceMessages].map(([id, rows]) => [
      id,
      rows
        .sort((a, b) => a[5] - b[5])
        .map((r) => r[7])
        .join(""),
    ]),
  );
  const callRows = sheets.Prompts.rows.filter((r) => r[1] === "Call message");
  const searchText = new Map(
    people.map((p) => [
      p[0],
      [...p, ...interviewsByPerson.get(p[0]).flat(), ...verdicts.get(p[0])]
        .join(" ")
        .toLowerCase(),
    ]),
  );
  const sourceSearchText = new Map(
    sources.map((s) => [s.id, [...s.row, s.text].join(" ").toLowerCase()]),
  );
  const queryInput = document.getElementById("person-search");
  const firmSelect = document.getElementById("firm-filter");
  const roleSelect = document.getElementById("role-filter");
  const dialog = document.getElementById("source-dialog");
  let route = {};
  let libraryPage = 0;
  let sourceQuery = "";
  let sourceKind = "";
  const pageSize = 30;

  [...new Set(people.map((p) => p[2]))].forEach((f) =>
    firmSelect.add(new Option(f, f)),
  );
  [...new Set(people.map((p) => p[3]))].forEach((r) =>
    roleSelect.add(new Option(r, r)),
  );
  const filteredPeople = () =>
    people.filter(
      (p) =>
        (!firmSelect.value || p[2] === firmSelect.value) &&
        (!roleSelect.value || p[3] === roleSelect.value) &&
        (!queryInput.value.trim() ||
          searchText.get(p[0]).includes(queryInput.value.trim().toLowerCase())),
    );
  const avatar = (p) =>
    `<span class="avatar" aria-hidden="true">${escape(firstName(p).slice(0, 1))}</span>`;
  function renderPeople() {
    const filtered = filteredPeople();
    document.getElementById("person-count").textContent =
      `${filtered.length} of ${people.length} people`;
    document.getElementById("people-list").innerHTML = filtered.length
      ? filtered
          .map(
            (p) =>
              `<a class="person-link ${route.agent === p[0] ? "selected" : ""}" href="${personUrl(p[0])}" ${route.agent === p[0] ? 'aria-current="page"' : ""}>
        ${avatar(p)}<span><span class="person-name">${escape(firstName(p))}</span><span class="person-number"> · ${escape(p[2])}</span><span class="person-role">${escape(p[3])}</span></span>
      </a>`,
          )
          .join("")
      : '<p class="empty">No matching people. Try another phrase or reset the filters.</p>';
  }
  const footer = () =>
    `<footer class="archive-footer"><span>Static reader · original content preserved</span><div><a href="data/workbook.json" download>Full JSON corpus</a><a href="data/manifest.json">Content manifest</a><a href="https://github.com/Divitmehta123/revenue-integrity-interview-atlas" target="_blank" rel="noopener noreferrer">Open-source repository ↗</a></div></footer>`;
  const note = () =>
    '<div class="synthetic-note">66 fictional personas. New synthetic interviews. <a href="#view=scope">Read scope & limits</a> before interpreting the answers.</div>';

  function renderOverview() {
    const firmGroups = [...new Set(people.map((p) => p[2]))].map((f) => ({
      firm: f,
      people: people.filter((p) => p[2] === f),
    }));
    main.innerHTML = `<section class="page-heading"><div><span class="eyebrow">The complete interview archive</span><h1>Revenue integrity.<br>Interview atlas.</h1><p class="description">Browse every interview by person or question. Read the original answers alongside recorded context, separate analyst verdicts, and exact prompts.</p></div></section>
      ${note()}
      <div class="overview-layout"><section class="panel"><h2 class="panel-title">The fictional participant map</h2><p class="muted small" style="margin-top:7px">One square per persona. Select a square to open the interview.</p><div class="coverage-map">${firmGroups.map((g) => `<div class="firm-cell ${g.firm === "External" ? "external" : ""}"><a href="${personUrl(g.people[0][0])}">${escape(g.firm)} · ${g.people.length}</a><div class="dots">${g.people.map((p) => `<a class="person-dot" href="${personUrl(p[0])}" title="${escape(p[1])}" aria-label="Open ${escape(p[1])}"></a>`).join("")}</div></div>`).join("")}</div><div class="map-legend"><span><i class="legend-key" aria-hidden="true"></i>Firm staff</span><span><i class="legend-key external" aria-hidden="true"></i>Client & incumbent personas</span><span>Coverage, not demand</span></div></section>
      <section class="panel"><h2 class="panel-title">Inside the archive</h2><div class="index-stats"><div><strong>${people.length}</strong><span>complete interviews</span></div><div><strong>${interviews.filter((r) => r[4] === "Initial").length}</strong><span>initial answers</span></div><div><strong>${interviews.filter((r) => r[4] === "Follow-up").length}</strong><span>answered follow-ups</span></div></div><div class="guide-steps"><div class="guide-step"><span class="step-mark">Q</span><div><h3>Start with the question</h3><p>Compare the same question across people, or follow one person's complete interview.</p></div></div><div class="guide-step"><span class="step-mark">S</span><div><h3>Open the recorded context</h3><p>Source buttons reveal original saved statements and any claim cautions.</p></div></div><div class="guide-step"><span class="step-mark">V</span><div><h3>Keep the two verdicts separate</h3><p>A persona's position and the analyst's interpretation are shown independently.</p></div></div></div><a class="primary-button start-link" href="${personUrl(0)}">Read the first interview →</a></section></div>
      <section><div class="section-heading"><h2>The 12 initial questions</h2><p>Exact wording from the workbook. Follow-ups are specific to each person.</p></div><div class="question-grid">${questions.map((q) => `<a class="question-tile" href="#view=questions&q=${q.id}"><span class="question-id">${q.id}</span><span>${escape(q.text)}</span></a>`).join("")}</div></section>${footer()}`;
  }

  function personHeader(person, tab) {
    const index = people.findIndex((p) => p[0] === person[0]);
    const earlier = people[index - 1],
      later = people[index + 1];
    const tabs = [
      ["interview", "Interview"],
      ["verdicts", "Verdicts"],
      ["profile", "Profile"],
      ["sources", "Sources"],
      ["prompts", "Exact prompts"],
    ];
    return `<div class="person-heading">${avatar(person)}<div><span class="eyebrow">Fictional persona · Agent ${String(person[0]).padStart(2, "0")}</span><h1>${escape(firstName(person))}</h1><p class="role-line">${escape(person[2])} · ${escape(person[3])}</p></div><div class="person-controls"><button class="icon-button" type="button" data-person="${earlier?.[0] ?? ""}" aria-label="Previous person" ${earlier ? "" : "disabled"}>←</button><button class="icon-button" type="button" data-person="${later?.[0] ?? ""}" aria-label="Next person" ${later ? "" : "disabled"}>→</button></div></div>
      <div class="person-meta"><span><strong>12</strong> initial answers</span><span><strong>3</strong> answered follow-ups</span><span><strong>${person[10]}</strong> saved statements supplied</span><span>Eligible rounds <strong>${person[12]}–${person[13]}</strong></span></div>
      <nav class="tabs" aria-label="${escape(firstName(person))} interview sections">${tabs.map(([key, label]) => `<a href="${personUrl(person[0], key)}" ${key === tab ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
  }
  function supportButtons(ids) {
    return ids
      ? `<div class="source-buttons">${String(ids)
          .split("\n")
          .filter(Boolean)
          .map(
            (id) =>
              `<button type="button" class="source-button" data-source="${escape(id)}">${escape(id)}</button>`,
          )
          .join("")}</div>`
      : '<span class="muted small">No recorded source IDs supplied.</span>';
  }
  function utcDate(serial) {
    if (typeof serial !== "number") return String(serial || "");
    return new Date(Math.round((serial - 25569) * 86400000))
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z$/, " UTC");
  }
  function answerContents(row) {
    return `<div class="answer-body">${exact(row[8])}<div class="answer-context">${row[4] === "Follow-up" ? `<div class="reason"><span class="field-label">Why this follow-up · parent ${escape(row[6])}</span>${exact(row[12])}</div>` : ""}<div><span class="field-label">Basis</span>${exact(row[9])}${supportButtons(row[10])}</div>${row[11] ? `<div><span class="field-label">Uncertainty</span>${exact(row[11])}</div>` : ""}${row[16] ? `<div class="caution"><span class="field-label">Analyst cautions</span>${exact(row[16])}</div>` : ""}</div><div class="provenance"><span>Model: ${escape(row[13])}</span><span>Reasoning: ${escape(row[14])}</span><span>${escape(utcDate(row[15]))}</span></div></div>`;
  }
  function answerCard(row, open = false) {
    return `<details class="answer-card ${row[4] === "Follow-up" ? "followup" : ""}" id="answer-${row[5]}" ${open ? "open" : ""}><summary><span class="question-id">${escape(row[5])}</span><span class="answer-question">${escape(row[7])}</span></summary>${answerContents(row)}</details>`;
  }
  function renderInterview(person) {
    const rows = interviewsByPerson.get(person[0]);
    const initial = rows.filter((r) => r[4] === "Initial");
    const followup = rows.filter((r) => r[4] === "Follow-up");
    return `<div class="reader-layout"><div><div class="reader-toolbar"><span>Original answers · no rewritten summaries</span><button class="text-button" type="button" id="toggle-answers">Expand all answers</button></div>${initial.map((r, i) => answerCard(r, route.q === r[5] || (!route.q && i === 0))).join("")}<div class="followup-heading"><span class="eyebrow">Adaptive interview</span><h2>Three answered follow-ups</h2><p>The question, its reason, and its parent are preserved.</p></div>${followup.map((r) => answerCard(r, route.q === r[5])).join("")}</div><aside class="reader-rail" aria-label="Jump to a question"><span class="eyebrow">In this interview</span>${rows.map((r) => `<a href="${personUrl(person[0], "interview", r[5])}"><span class="mono">${escape(r[5])}</span>${escape(r[7])}</a>`).join("")}</aside></div>`;
  }
  function renderVerdicts(person) {
    const row = verdicts.get(person[0]);
    const field = (label, value) =>
      `<div class="verdict-field"><span class="field-label">${escape(label)}</span>${exact(value)}</div>`;
    return `${note()}<div class="verdict-grid"><section class="verdict-panel"><span class="eyebrow">Analyst interpretation</span><h2>${escape(row[4])}</h2>${exact(row[5])}${field("Analyst next validation", row[11])}</section><section class="verdict-panel persona"><span class="eyebrow">Persona recommendation</span><h2>${escape(row[6])}</h2>${field("Personal adoption position", row[7])}${field("Persona rationale", row[8])}${field("What changes their mind", row[9])}${field("Persona next validation", row[10])}</section></div>`;
  }
  function renderProfile(person) {
    const headings = sheets.Personas.headers;
    return `<div class="synthetic-note">Invented profiles, not observed customers. Relationships are fictional scenario inputs.</div><div class="profile-grid">${[4, 5, 6, 7, 8, 9].map((i) => `<section class="profile-field ${i === 4 || i === 9 ? "wide" : ""}"><h2>${escape(headings[i])}</h2>${exact(person[i]) || ""}${person[i] === "" ? '<span class="muted small">No assigned relationship recorded.</span>' : ""}</section>`).join("")}<section class="window-panel"><h2>Eligible saved statement window</h2><div class="window-track" role="img" aria-label="${person[10]} eligible own statements, first round ${person[12]}, last round ${person[13]}, across ${escape(person[11])}. Not continuous activity."><div class="window-range" style="left:${((person[12] - 1) / 167) * 100}%;width:${((person[13] - person[12]) / 167) * 100}%"></div></div><div class="window-labels"><span>Round 1</span><span>168</span></div><p class="window-caption">${person[10]} eligible saved statements · ${escape(person[11])} · first ${person[12]}, last ${person[13]}. This span is not continuous participation and combines both platforms.</p></section></div>`;
  }
  function sourceMetadata(source) {
    const row = source.row;
    return `<div class="record-meta"><span>${escape(row[3] || "Product brief")}</span><span>${escape(row[4])}</span>${row[5] !== "" ? `<span>Round ${escape(row[5])}</span>` : ""}<span>${escape(row[6])}</span><span>${escape(row[7])}</span></div>`;
  }
  function sourceCard(source, open = false) {
    return `<details class="source-card" ${open ? "open" : ""}><summary><span class="source-title">${escape(source.id)}</span><span class="source-summary">${escape(source.row[3] || "Product brief")} ${source.row[5] !== "" ? "· round " + escape(source.row[5]) : ""}</span></summary><div class="source-content">${sourceMetadata(source)}${exact(source.text)}${source.row[9] ? `<div class="caution"><span class="field-label">Claim caution</span>${exact(source.row[9])}</div>` : ""}</div></details>`;
  }
  function renderPersonSources(person) {
    const ownSources = sources.filter((s) => s.row[2] === person[0]);
    return `<div class="reader-toolbar"><span>${ownSources.length} complete eligible own-text records</span><button id="toggle-sources" class="text-button" type="button">Expand all records</button></div>${ownSources.map((s) => sourceCard(s)).join("")}<p class="muted small" style="margin-top:23px">The full brief is available in <a href="#view=evidence&kind=brief">Evidence</a>. The exact selected context is preserved in this person's prompts.</p>`;
  }
  function renderPrompts(person) {
    return `<div class="synthetic-note">Accepted-stage messages. Ordered parts preserve full text. Call rows reference the message IDs. Repeated text appears once in the workbook.</div>${[
      "Initial",
      "Follow-up",
    ]
      .map((stage) => {
        const calls = callRows
          .filter((r) => r[2] === person[0] && r[3] === stage)
          .sort((a, b) => a[5] - b[5]);
        return `<h2 class="prompt-stage">${stage === "Initial" ? "Initial interview" : "Follow-up interview"}</h2>${calls.map((r) => `<details class="prompt-card"><summary>${escape(r[5])}. ${escape(r[4])} · ${escape(r[6])}</summary><p class="prompt-note">Exact message. Long messages scroll within this panel; no text is omitted.</p><pre>${escape(messages.get(r[6]))}</pre></details>`).join("")}`;
      })
      .join("")}`;
  }
  function renderPerson() {
    const person = people.find((p) => p[0] === route.agent);
    if (!person) {
      renderOverview();
      return;
    }
    const allowedTabs = [
      "interview",
      "verdicts",
      "profile",
      "sources",
      "prompts",
    ];
    const tab = allowedTabs.includes(route.tab) ? route.tab : "interview";
    const content = {
      interview: renderInterview,
      verdicts: renderVerdicts,
      profile: renderProfile,
      sources: renderPersonSources,
      prompts: renderPrompts,
    }[tab](person);
    main.innerHTML = personHeader(person, tab) + content + footer();
    if (route.q && tab === "interview")
      requestAnimationFrame(() =>
        document
          .getElementById("answer-" + route.q)
          ?.scrollIntoView({ block: "start" }),
      );
  }
  function renderQuestions() {
    const q = questions.find((q) => q.id === route.q) || questions[0];
    const allowedIds = new Set(filteredPeople().map((p) => p[0]));
    const answers = interviews.filter(
      (r) => r[4] === "Initial" && r[5] === q.id && allowedIds.has(r[0]),
    );
    main.innerHTML = `<div class="page-heading"><div><span class="eyebrow">Compare exact answers</span><h1>One question.<br>Every perspective.</h1><p class="description">Use the person, firm, and role filters to narrow the view. These are synthetic opinions, not independent customer observations.</p></div></div>${note()}<label class="search-label" for="question-select">Choose an initial question</label><select class="question-chooser" id="question-select">${questions.map((item) => `<option value="${item.id}" ${q.id === item.id ? "selected" : ""}>${item.id} · ${escape(item.text)}</option>`).join("")}</select><div class="reader-toolbar"><span>${answers.length} exact answers shown</span><button id="toggle-answers" class="text-button" type="button">Expand all answers</button></div><div class="question-results">${
      answers.length
        ? answers
            .map((r) => {
              const p = people.find((p) => p[0] === r[0]);
              return `<details class="answer-card"><summary>${avatar(p)}<span class="comparison-name">${escape(firstName(p))}<span class="comparison-role" style="display:block">${escape(p[2])} · ${escape(p[3])}</span></span></summary>${answerContents(r)}<div style="padding:0 20px 20px"><a class="comparison-link" href="${personUrl(p[0], "interview", q.id)}">Open the complete interview →</a></div></details>`;
            })
            .join("")
        : '<p class="empty">No answers match the current filters. Reset the people filters to see all responses.</p>'
    }</div>${footer()}`;
  }
  function matchingSources() {
    const query = sourceQuery.toLowerCase().trim();
    return sources.filter(
      (s) =>
        (!sourceKind ||
          (sourceKind === "brief"
            ? s.id.startsWith("BRIEF-")
            : s.row[4] === sourceKind)) &&
        (!query || sourceSearchText.get(s.id).includes(query)),
    );
  }
  function renderLibraryResults() {
    const matches = matchingSources();
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    libraryPage = Math.min(libraryPage, pages - 1);
    const start = libraryPage * pageSize;
    document.getElementById("library-results").innerHTML =
      `<div class="reader-toolbar"><span>${matches.length} matching complete records</span><span class="mono">Page ${libraryPage + 1} / ${pages}</span></div>${matches
        .slice(start, start + pageSize)
        .map((s) => sourceCard(s))
        .join(
          "",
        )}${!matches.length ? '<p class="empty">No matching records. Try another phrase or source type.</p>' : ""}<div class="pagination"><span>Showing ${matches.length ? start + 1 : 0}–${Math.min(start + pageSize, matches.length)} of ${matches.length}</span><div><button class="secondary-button" data-library-page="${libraryPage - 1}" ${libraryPage === 0 ? "disabled" : ""}>Previous</button><button class="secondary-button" data-library-page="${libraryPage + 1}" ${libraryPage === pages - 1 ? "disabled" : ""}>Next</button></div></div>`;
  }
  function renderEvidence() {
    sourceKind = ["brief", "twitter", "reddit"].includes(route.kind)
      ? route.kind
      : sourceKind;
    main.innerHTML = `<div class="page-heading"><div><span class="eyebrow">Source archive</span><h1>Recorded context.</h1><p class="description">${sources.filter((s) => !s.id.startsWith("BRIEF-")).length.toLocaleString()} complete eligible statements and ${sources.filter((s) => s.id.startsWith("BRIEF-")).length} product-brief sections, including its introduction. Workbook parts are joined in their original order.</p></div></div><div class="synthetic-note">Recorded unsupported claims are preserved with cautions, not treated as implemented capabilities or real operating results.</div><div class="library-tools"><input id="source-search" type="search" placeholder="Search original text, person, source ID…" aria-label="Search original sources" value="${escape(sourceQuery)}"><label>Source<select id="source-kind"><option value="">All sources</option><option value="twitter">Twitter</option><option value="reddit">Reddit</option><option value="brief">Product brief</option></select></label></div><div id="library-results"></div>${footer()}`;
    document.getElementById("source-kind").value = sourceKind;
    renderLibraryResults();
  }
  function renderScope() {
    const scope = sheets.Verdicts.outside_cells;
    main.innerHTML = `<div class="page-heading"><div><span class="eyebrow">Read before interpreting</span><h1>${escape(scope.Q2)}</h1><p class="description">The original workbook notes are reproduced verbatim below.</p></div></div><p class="scope-lead exact">${escape(scope.Q3)}</p><div class="scope-list">${Array.from(
      { length: 11 },
      (_, i) => i + 4,
    )
      .map(
        (row, i) =>
          `<div class="scope-item"><span class="mono">${String(i + 1).padStart(2, "0")}</span>${exact(scope["Q" + row])}</div>`,
      )
      .join(
        "",
      )}</div><p class="hash">Original workbook SHA-256<br>${escape(workbook.workbook_sha256)}</p>${footer()}`;
  }
  function render() {
    const params = new URLSearchParams(location.hash.slice(1));
    const agent = params.get("agent");
    route = {
      view: params.get("view") || "overview",
      agent: agent !== null && /^\d+$/.test(agent) ? Number(agent) : null,
      tab: params.get("tab"),
      q: params.get("q"),
      kind: params.get("kind"),
    };
    document.querySelectorAll(".primary-nav a").forEach((a) => {
      if (route.agent === null && a.dataset.view === route.view)
        a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    renderPeople();
    if (route.agent !== null) renderPerson();
    else
      (
        ({
          overview: renderOverview,
          questions: renderQuestions,
          evidence: renderEvidence,
          scope: renderScope,
        })[route.view] || renderOverview
      )();
    const selected = people.find((p) => p[0] === route.agent);
    document.title = `${selected ? firstName(selected) + " · " : ""}Revenue Integrity · Interview atlas`;
  }
  function updateFilters() {
    renderPeople();
    if (route.view === "questions" && route.agent === null) renderQuestions();
  }
  queryInput.addEventListener("input", updateFilters);
  firmSelect.addEventListener("change", updateFilters);
  roleSelect.addEventListener("change", updateFilters);
  document.getElementById("reset-filters").addEventListener("click", () => {
    queryInput.value = "";
    firmSelect.value = "";
    roleSelect.value = "";
    updateFilters();
  });
  main.addEventListener("change", (event) => {
    if (event.target.id === "question-select")
      location.hash = `view=questions&q=${event.target.value}`;
    if (event.target.id === "source-kind") {
      sourceKind = event.target.value;
      libraryPage = 0;
      renderLibraryResults();
    }
  });
  main.addEventListener("input", (event) => {
    if (event.target.id === "source-search") {
      sourceQuery = event.target.value;
      libraryPage = 0;
      renderLibraryResults();
    }
  });
  document.addEventListener("click", (event) => {
    const sourceButton = event.target.closest("[data-source]");
    if (sourceButton) {
      const source = sourcesById.get(sourceButton.dataset.source);
      document.getElementById("source-dialog-title").textContent =
        sourceButton.dataset.source;
      document.getElementById("source-dialog-body").innerHTML = source
        ? sourceMetadata(source) +
          exact(source.text) +
          (source.row[9]
            ? `<div class="caution"><span class="field-label">Claim caution</span>${exact(source.row[9])}</div>`
            : "")
        : "<p>This source ID was cited in the answer but has no matching record in the workbook. The original ID is preserved.</p>";
      dialog.showModal();
    }
    const personButton = event.target.closest("[data-person]");
    if (personButton && personButton.dataset.person !== "")
      location.hash = personUrl(
        Number(personButton.dataset.person),
        route.tab || "interview",
      );
    const pageButton = event.target.closest("[data-library-page]");
    if (pageButton && !pageButton.disabled) {
      libraryPage = Number(pageButton.dataset.libraryPage);
      renderLibraryResults();
      document
        .querySelector(".library-tools")
        .scrollIntoView({ block: "start" });
    }
    const expander = event.target.closest("#toggle-answers, #toggle-sources");
    if (expander) {
      const selector =
        expander.id === "toggle-answers" ? ".answer-card" : ".source-card";
      const cards = [...main.querySelectorAll(selector)];
      const expand = cards.some((card) => !card.open);
      cards.forEach((card) => (card.open = expand));
      expander.textContent = `${expand ? "Collapse" : "Expand"} all ${expander.id === "toggle-answers" ? "answers" : "records"}`;
    }
  });
  document
    .getElementById("close-dialog")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  window.addEventListener("hashchange", () => {
    render();
    if (!route.q || route.agent === null) window.scrollTo(0, 0);
  });
  render();
})();
