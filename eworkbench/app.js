"use strict";

const root = new URL("./", document.baseURI);
const $ = id => document.getElementById(id);
const state = {
  catalog: [], project: null, schematic: null, simulator: null,
  repositoryModel: "", token: 0
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
