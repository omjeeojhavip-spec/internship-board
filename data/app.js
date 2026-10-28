(function () {
  "use strict";

  const DATA_URL = "data/internships.json";

  const els = {
    form: document.getElementById("filter-form"),
    search: document.getElementById("search"),
    domain: document.getElementById("domain"),
    mode: document.getElementById("mode"),
    list: document.getElementById("list"),
    status: document.getElementById("status"),
    loading: document.getElementById("loading"),
    empty: document.getElementById("empty"),
    error: document.getElementById("error"),
    retry: document.getElementById("retry"),
    emptyReset: document.getElementById("empty-reset"),
  };

  let internships = [];

  function show(el, visible) { el.hidden = !visible; }

  function buildCard(item) {
    const li = document.createElement("li");
    const card = document.createElement("article");
    card.className = "card";

    const h2 = document.createElement("h2");
    h2.textContent = item.title;

    const company = document.createElement("p");
    company.className = "company";
    company.textContent = item.company;

    const meta = document.createElement("ul");
    meta.className = "meta";
    meta.setAttribute("aria-label", "Details");
    [item.domain, item.mode, item.location, item.duration].forEach(function (text) {
      if (!text) return;
      const t = document.createElement("li");
      t.className = "tag";
      t.textContent = text;
      meta.appendChild(t);
    });

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = item.description;

    const apply = document.createElement("a");
    apply.className = "apply";
    apply.href = item.applyUrl || "#";
    apply.textContent = "Apply";
    apply.setAttribute("aria-label", "Apply for " + item.title + " at " + item.company);

    card.append(h2, company, meta, desc, apply);
    li.appendChild(card);
    return li;
  }

  function populateDomains() {
    const domains = Array.from(new Set(internships.map(function (i) { return i.domain; }))).sort();
    domains.forEach(function (d) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      els.domain.appendChild(opt);
    });
  }

  function getFiltered() {
    const q = els.search.value.trim().toLowerCase();
    const domain = els.domain.value;
    const mode = els.mode.value;
    return internships.filter(function (i) {
      const matchesText = !q || (i.title + " " + i.company).toLowerCase().includes(q);
      const matchesDomain = domain === "all" || i.domain === domain;
      const matchesMode = mode === "all" || i.mode === mode;
      return matchesText && matchesDomain && matchesMode;
    });
  }

  function render() {
    const results = getFiltered();
    els.list.replaceChildren();
    show(els.error, false);
    show(els.loading, false);

    if (results.length === 0) {
      show(els.empty, true);
      els.status.textContent = "No internships match your filters.";
      return;
    }
    show(els.empty, false);
    const frag = document.createDocumentFragment();
    results.forEach(function (item) { frag.appendChild(buildCard(item)); });
    els.list.appendChild(frag);
    els.status.textContent = "Showing " + results.length + " of " + internships.length + " internships.";
  }

  function resetFilters() {
    els.form.reset();
    render();
    els.search.focus();
  }

  async function load() {
    show(els.error, false);
    show(els.empty, false);
    show(els.loading, true);
    els.status.textContent = "Loading internships…";
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data");
      internships = data;
      if (els.domain.options.length <= 1) populateDomains();
      render();
    } catch (err) {
      show(els.loading, false);
      show(els.error, true);
      els.status.textContent = "Failed to load internships.";
      console.error(err);
    }
  }

  els.search.addEventListener("input", render);
  els.domain.addEventListener("change", render);
  els.mode.addEventListener("change", render);
  els.form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  els.form.addEventListener("reset", function () { setTimeout(render, 0); });
  els.emptyReset.addEventListener("click", resetFilters);
  els.retry.addEventListener("click", load);

  document.addEventListener("keydown", function (e) {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
    if (e.key === "/" && !typing) {
      e.preventDefault();
      els.search.focus();
    } else if (e.key === "Escape" && document.activeElement === els.search) {
      els.search.value = "";
      render();
    }
  });

  load();
})();
