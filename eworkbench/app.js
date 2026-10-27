"use strict";

const root = new URL("./", document.baseURI);
const $ = id => document.getElementById(id);
const state = {
  catalog: [], project: null, schematic: null, simulator: null,
  repositoryModel: "", token: 0, roadmap: null, currentRoadmapNodes: []
};
const controls = ["runBtn", "saveBtn", "exportBtn", "importBtn", "resetBtn"];

function report(message, error = false) {
  $("error").hidden = !error;
  $("error").textContent = error ? message : "";
  if (!error) $("simStatus").textContent = message;
}
async function fetchChecked(url, as = "json") {
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) throw new Error("Could not load " + url.pathname + " (" + response.status + ")");
  return as === "json" ? response.json() : response.text();
}
function pathForProject(id) {
  return new URL("projects/" + id + "/", root);
}
function option(select, text, value) {
  const el = document.createElement("option");
  el.textContent = text; el.value = value; select.append(el);
}
function linkSelection() {
  const url = new URL(location.href);
  url.searchParams.set("project", state.project.id);
  url.searchParams.set("schematic", state.schematic.id);
  history.replaceState(null, "", url);
}
function enableSimulatorControls(yes) {
  controls.forEach(id => $(id).disabled = !yes);
}
function draftKey() {
  return "jmbjr.eworkbench.draft." + state.project.id + "." + state.schematic.id;
}
function setButtonState() {
  if (!state.simulator) return;
  $("runBtn").textContent = state.simulator.isRunning() ? "⏸ Pause" : "▶ Run";
}
function setView(which) {
  $("observed").hidden = which !== "observed";
  $("simulation").hidden = which !== "simulation";
  $("emptyState").hidden = which !== "empty";
}
function element(tag, className = "", textValue = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textValue !== null) node.textContent = String(textValue);
  return node;
}

function fieldNotesKey() {
  const project = state.project?.projectCode || state.project?.id || "none";
  const steps = state.currentRoadmapNodes.map(n => n.id).join("_") || "general";
  return "jmbjr.eworkbench.fieldNotes.v1." + project + "." + steps;
}
function restoreFieldNotes() {
  $("fieldNotesLabel").textContent = "Field notes for " +
    (state.currentRoadmapNodes.map(n => n.id).join(", ") || "this project");
  try {
    $("fieldNotes").value = localStorage.getItem(fieldNotesKey()) || "";
    $("fieldNotesStatus").textContent = "Notes stay in this browser until you paste them into chat.";
  } catch {
    $("fieldNotes").value = "";
    $("fieldNotesStatus").textContent = "Browser storage unavailable; copy notes before leaving.";
  }
}
function renderRoadmap(data) {
  state.roadmap = data;
  const project = data.project || {};
  const milestones = (data.nodes || []).filter(n =>
    ["step", "decision"].includes(n.kind) && n.status !== "not_applicable");
  const completed = milestones.filter(n => n.status === "done").length;
  $("roadmapTitle").textContent = "Current roadmap · " + (project.id || state.project.id);
  $("roadmapObjective").textContent = "Iteration " + (project.iteration ?? "?") +
    " objective: " + (project.objective || "Not specified");
  $("roadmapUpdated").textContent = project.updated_at ? "Tracker updated " + project.updated_at : "";
  $("roadmapProgress").max = Math.max(milestones.length, 1);
  $("roadmapProgress").value = completed;
  $("roadmapCounts").textContent = completed + " of " + milestones.length +
    " active steps/decisions completed";

  const byId = new Map((data.nodes || []).map(n => [n.id, n]));
  const activeIds = Array.isArray(project.current_node_ids) ? project.current_node_ids : [];
  const active = activeIds.map(id => byId.get(id)).filter(Boolean);
  state.currentRoadmapNodes = active;

  const container = $("activeRoadmapSteps");
  container.replaceChildren();
  if (!active.length) {
    container.append(element("p", "notice", "The tracker has no current step selected."));
  }
  for (const node of active) {
    const card = element("article", "active-roadmap-card");
    const top = element("div", "active-roadmap-title");
    top.append(element("span", "step-code", node.id), element("strong", "", node.title));
    top.append(element("span", "status-chip", (node.status || "unknown").replaceAll("_", " ")));
    card.append(top);
    if (node.summary) card.append(element("p", "muted", node.summary));
    if (node.kind === "decision" && node.question) card.append(element("p", "", node.question));

    const criteria = node.acceptance_criteria ||
      (node.decision_rule ? [node.decision_rule] : []);
    if (criteria.length) {
      card.append(element("h4", "", node.kind === "decision" ? "Decision rule" : "Completion criteria"));
      const list = element("ul");
      criteria.forEach(v => list.append(element("li", "", v)));
      card.append(list);
    }
    const guide = state.project.benchGuides?.[node.id] || [];
    if (guide.length) {
      card.append(element("h4", "", "Next bench actions"));
      const list = element("ol");
      guide.forEach(v => list.append(element("li", "", v)));
      card.append(list);
    }
    const suggested = state.project.benchSchematicRefs?.[node.id] || [];
    const refs = (state.project.schematics || []).filter(s => suggested.includes(s.id));
    if (refs.length) {
      card.append(element("h4", "", "Relevant schematics"));
      const links = element("div", "roadmap-schema-links");
      for (const schematic of refs) {
        const button = element("button", "", "Open " + schematic.title);
        button.type = "button";
        button.addEventListener("click", () => selectSchematic(schematic.id).catch(showError));
        links.append(button);
      }
      card.append(links);
    }
    container.append(card);
  }
  const timeline = $("roadmapTimeline");
  timeline.replaceChildren();
  for (const node of milestones) {
    const li = element("li", "roadmap-item");
    if (activeIds.includes(node.id)) li.classList.add("roadmap-current");
    if (node.status === "done") li.classList.add("roadmap-complete");
    const name = element("strong", "", node.id + " · " + node.title);
    const status = element("span", "muted small", " · " + (node.status || "unknown").replaceAll("_", " "));
    li.append(name, status);
    if (node.summary) li.append(element("p", "small muted", node.summary));
    timeline.append(li);
  }
  restoreFieldNotes();
}
async function loadRoadmap() {
  const selected = state.project;
  const section = $("roadmapSection");
  const error = $("roadmapError");
  state.roadmap = null;
  state.currentRoadmapNodes = [];
  section.hidden = !selected.roadmapData;
  error.hidden = true;
  $("activeRoadmapSteps").replaceChildren();
  $("roadmapTimeline").replaceChildren();
  if (!selected.roadmapData) return;
  $("roadmapObjective").textContent = "Loading project tracker…";
  try {
    const data = await fetchChecked(new URL(selected.roadmapData, root));
    if (state.project !== selected) return;
    if (!data.project || !Array.isArray(data.nodes)) throw new Error("Invalid project roadmap JSON");
    renderRoadmap(data);
  } catch (err) {
    if (state.project !== selected) return;
    error.hidden = false;
    error.textContent = "Could not load the published roadmap: " + err.message +
      ". Use the Project roadmap link above for the source file.";
    $("roadmapObjective").textContent = "";
    $("roadmapCounts").textContent = "";
    $("roadmapUpdated").textContent = "";
  }
}

function handoffMessage() {
  const active = state.currentRoadmapNodes;
  const name = state.project?.title || "EWorkbench project";
  const schematic = state.schematic;
  const link = location.href;
  const notes = $("fieldNotes").value.trim();
  return [
    "EWorkbench field update — " + name,
    "Project: " + (state.project?.projectCode || state.project?.id || "unknown"),
    "Roadmap step: " + (active.length ?
      active.map(n => n.id + " — " + n.title + " (" + n.status + ")").join("; ") :
      "No current step"),
    "Schematic: " + (schematic ? schematic.title + " [" + schematic.id + "]" : "none"),
    "Workbench link: " + link,
    "",
    "New findings / measurements:",
    notes || "(Add readings, probe points, power state, and uncertainties here.)",
    "",
    "Please reconcile these findings with the existing measured netlist and roadmap,",
    "distinguish observed continuity from hypotheses, and propose the next bench test.",
    "For GitHub changes, open a PR; I will review/merge it. Photos/files will be attached separately."
  ].join("\n");
}

function renderProjects() {
  const list = $("projectList"); list.replaceChildren();
  $("projectCount").textContent = state.catalog.length + " total";
  for (const item of state.catalog) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "project-card";
    if (state.project?.id === item.id) button.classList.add("selected");
    const name = document.createElement("strong"); name.textContent = item.title;
    const sub = document.createElement("span"); sub.textContent = item.summary || "Project";
    button.append(name, sub);
    button.onclick = () => selectProject(item.id).catch(showError);
    list.append(button);
  }
}
function showError(err) {
  $("error").hidden = false;
  $("error").textContent = err instanceof Error ? err.message : String(err);
  console.error(err);
}
async function selectProject(id, requestedSchematic = null) {
  const item = state.catalog.find(p => p.id === id);
  if (!item) throw new Error("Project not found: " + id);
  state.project = await fetchChecked(new URL(item.path, root));
  state.project.id = id;
  $("projectTitle").textContent = state.project.title;
  $("projectBadge").textContent = state.project.projectCode || "PROJECT";
  $("projectDescription").textContent = state.project.description || "";
  $("roadmapLink").hidden = !state.project.roadmap;
  if (state.project.roadmap) $("roadmapLink").href = state.project.roadmap;
  renderProjects();
  loadRoadmap().catch(showError);
  const picker = $("schematicSelect"); picker.replaceChildren();
  for (const schematic of state.project.schematics || []) option(picker, schematic.title, schematic.id);
  const picked = state.project.schematics.find(s => s.id === requestedSchematic)?.id ||
    state.project.schematics[0]?.id;
  if (picked) await selectSchematic(picked);
  else setView("empty");
}
function cell(text) {
  const td = document.createElement("td");
  td.textContent = text == null ? "" : String(text);
  return td;
}
function drawPadTable(data) {
  const table = document.createElement("table");
  const head = document.createElement("thead"), row = document.createElement("tr");
  for (const h of ["Pad position", "Manufacturer pin", "Function", "Mapped net"]) {
    const th = document.createElement("th"); th.textContent = h; row.append(th);
  }
  head.append(row); table.append(head);
  const body = document.createElement("tbody");
  for (const contact of data.contacts || []) {
    const r = document.createElement("tr");
    r.append(cell(contact.id), cell(contact.manufacturer_pin ?? "Unknown"),
      cell(contact.function ?? "Unidentified"), cell(contact.net ?? "Not mapped"));
    body.append(r);
  }
  table.append(body); $("netTable").replaceChildren(table);
}
function drawEvidence(data) {
  const evidence = $("evidence"); evidence.replaceChildren();
  const notes = [...(data.notes || [])];
  if (data.known_connections?.length) {
    for (const connection of data.known_connections) notes.push(
      connection.alias + ": " + connection.evidence + " Physical pad: " +
      (connection.physical_pad ?? "not located"));
  }
  for (const note of notes) {
    const li = document.createElement("li"); li.textContent = note; evidence.append(li);
  }
  for (const source of data.sources || []) {
    if (!source.url?.startsWith("https://")) continue;
    const li = document.createElement("li"), anchor = document.createElement("a");
    anchor.href = source.url; anchor.target = "_blank"; anchor.rel = "noopener";
    anchor.textContent = source.label;
    li.append(anchor, document.createTextNode(" — " + source.scope));
    evidence.append(li);
  }
}
function drawNetTable(data) {
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const h of ["Net", "Confirmed connections", "Notes"]) {
    const th = document.createElement("th"); th.textContent = h; headRow.append(th);
  }
  head.append(headRow); table.append(head);
  const body = document.createElement("tbody");
  for (const net of data.nets || []) {
    const row = document.createElement("tr");
    row.append(cell(net.name), cell(net.connections.join(" · ")), cell(net.notes));
    body.append(row);
  }
  table.append(body);
  $("netTable").replaceChildren(table);
}
async function showObserved(entry, token) {
  const dir = pathForProject(state.project.id);
  const data = await fetchChecked(new URL(entry.source, dir));
  if (token !== state.token) return;
  setView("observed");
  $("observedTitle").textContent = entry.title;
  $("observedDescription").textContent = entry.description || "";
  $("observedImage").src = new URL(entry.diagram, dir).href;
  $("connectivityHeading").textContent = data.contacts ? "Physical contact inventory" : "Connectivity record";
  if (data.contacts) drawPadTable(data);
  else drawNetTable(data);
  drawEvidence(data);
}
function loadDraftOrRepository() {
  try { return localStorage.getItem(draftKey()) || state.repositoryModel; }
  catch { return state.repositoryModel; }
}
async function showSimulation(entry, token) {
  const dir = pathForProject(state.project.id);
  state.repositoryModel = await fetchChecked(new URL(entry.source, dir), "text");
  if (token !== state.token) return;
  setView("simulation");
  $("simulationTitle").textContent = entry.title;
  $("simulationDescription").textContent = entry.description || "";
  $("assumptions").textContent = "Assumptions: " + (entry.assumptions || []).join(" · ");
  enableSimulatorControls(false);
  report("Loading CircuitJS1…");
  const frame = $("simFrame");
  frame.src = new URL("vendor/circuitjs/circuitjs.html?running=false", root).href;

  // The iframe and controller share the same origin after Pages deployment.
  // CircuitJS1 provides the official importCircuit/exportCircuit API.
  let attempts = 0;
  let activated = false;
  const ready = () => {
    if (token !== state.token || activated) return;
    let sim = null;
    try { sim = frame.contentWindow.CircuitJS1; } catch {}
    if (!sim || typeof sim.importCircuit !== "function") {
      if (++attempts < 120) setTimeout(ready, 250);
      else report("CircuitJS1 did not initialize. Check the GitHub Pages build and browser console.", true);
      return;
    }
    activated = true;
    state.simulator = sim;
    try {
      sim.importCircuit(loadDraftOrRepository(), false);
      sim.setSimRunning(false);
      enableSimulatorControls(true);
      setButtonState();
      report("Ready. Edit directly in the simulator; save a browser draft or download a .txt file.");
    } catch (error) { showError(error); }
  };
  frame.addEventListener("load", ready, {once: true});
  setTimeout(ready, 800);
}
async function selectSchematic(id) {
  const entry = (state.project.schematics || []).find(s => s.id === id);
  if (!entry) throw new Error("Unknown schematic: " + id);
  state.schematic = entry; state.simulator = null;
  const token = ++state.token;
  $("schematicSelect").value = id;
  linkSelection();
  enableSimulatorControls(false);
  $("error").hidden = true;
  $("observed").hidden = true; $("simulation").hidden = true;
  if (entry.kind === "observed") return showObserved(entry, token);
  if (entry.kind === "simulation") return showSimulation(entry, token);
  throw new Error("Unsupported schematic kind " + entry.kind);
}
function downloadText(filename, content) {
  const objectUrl = URL.createObjectURL(new Blob([content], {type: "text/plain"}));
  const anchor = document.createElement("a");
  anchor.href = objectUrl; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
$("fieldNotes").addEventListener("input", () => {
  if (!state.project) return;
  try {
    localStorage.setItem(fieldNotesKey(), $("fieldNotes").value);
    $("fieldNotesStatus").textContent = "Draft saved locally. It has not been sent or committed.";
  } catch {
    $("fieldNotesStatus").textContent = "Could not store notes in this browser. Copy your update before leaving.";
  }
});
$("copyUpdateBtn").addEventListener("click", async () => {
  const text = handoffMessage();
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API is unavailable");
    await navigator.clipboard.writeText(text);
    $("manualCopyText").hidden = true;
    $("fieldNotesStatus").textContent = "Copied. Paste the message into our ChatGPT conversation and add photos/files.";
  } catch {
    const fallback = $("manualCopyText");
    fallback.hidden = false;
    fallback.value = text;
    fallback.focus();
    fallback.select();
    $("fieldNotesStatus").textContent =
      "Clipboard permission unavailable. The full update below is selected. Copy it manually, then paste into ChatGPT.";
  }
});
$("clearFieldNotesBtn").addEventListener("click", () => {
  if (!$("fieldNotes").value) return;
  if (!window.confirm("Clear the locally saved field notes for this roadmap step?")) return;
  $("fieldNotes").value = "";
  $("manualCopyText").hidden = true;
  try { localStorage.removeItem(fieldNotesKey()); } catch {}
  $("fieldNotesStatus").textContent = "Local notes cleared. GitHub data was not changed.";
});

$("schematicSelect").addEventListener("change", e => selectSchematic(e.target.value).catch(showError));
$("runBtn").addEventListener("click", () => {
  if (!state.simulator) return;
  state.simulator.setSimRunning(!state.simulator.isRunning());
  setButtonState();
});
$("saveBtn").addEventListener("click", () => {
  if (!state.simulator) return;
  try {
    localStorage.setItem(draftKey(), state.simulator.exportCircuit());
    report("Draft saved in this browser only. Download to back it up.");
  } catch (error) { showError(error); }
});
$("exportBtn").addEventListener("click", () => {
  if (!state.simulator) return;
  downloadText(state.project.id + "-" + state.schematic.id + ".txt", state.simulator.exportCircuit());
  report("Circuit exported to .txt.");
});
$("resetBtn").addEventListener("click", () => {
  if (!state.simulator) return;
  try {
    localStorage.removeItem(draftKey());
    state.simulator.importCircuit(state.repositoryModel, false);
    state.simulator.setSimRunning(false);
    setButtonState();
    report("Reset to the repository model; local draft deleted.");
  } catch (error) { showError(error); }
});
$("importBtn").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file || !state.simulator) return;
  try {
    const contents = await file.text();
    if (!contents.trim().startsWith("$")) throw new Error("Expected a CircuitJS1 .txt file.");
    state.simulator.importCircuit(contents, false);
    state.simulator.setSimRunning(false);
    setButtonState();
    report("Imported from " + file.name + ". Save a browser draft or download to keep changes.");
  } catch (error) { showError(error); }
  e.target.value = "";
});
(async function start() {
  try {
    const catalog = await fetchChecked(new URL("projects/index.json", root));
    state.catalog = catalog.projects || [];
    if (!state.catalog.length) { $("projectTitle").textContent = "No projects"; setView("empty"); return; }
    const search = new URL(location.href).searchParams;
    const selectedProject = state.catalog.find(p => p.id === search.get("project"))?.id || state.catalog[0].id;
    await selectProject(selectedProject, search.get("schematic"));
  } catch (error) { showError(error); $("projectTitle").textContent = "Could not open workbench"; }
})();
