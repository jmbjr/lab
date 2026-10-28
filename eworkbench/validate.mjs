#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const base = new URL(".", import.meta.url).pathname;
const read = p => fs.readFileSync(path.join(base,p),"utf8");
const exists = p => fs.existsSync(path.join(base,p));
const catalog = JSON.parse(read("projects/index.json"));
const errors = [];
for (const entry of catalog.projects) {
  const p = JSON.parse(read(entry.path));
  const dirname = path.dirname(entry.path);
  let roadmap = null;
  if (p.id !== entry.id) errors.push("Project ID mismatch: " + entry.id);
  const ids = new Set();
  if (p.roadmapData) {
    const roadmapPath = path.resolve(base, p.roadmapData);
    if (!fs.existsSync(roadmapPath)) {
      errors.push("Missing roadmap data: " + p.roadmapData);
    } else {
      try {
        const tracker = JSON.parse(fs.readFileSync(roadmapPath, "utf8"));
        roadmap = tracker;
        const nodeIds = new Set((tracker.nodes || []).map(n => n.id));
        if (tracker.project?.id !== p.projectCode)
          errors.push("Roadmap project code mismatch: " + entry.id);
        if (!Array.isArray(tracker.nodes) || !nodeIds.size)
          errors.push("Empty roadmap: " + entry.id);
        for (const current of tracker.project?.current_node_ids || []) {
          if (!nodeIds.has(current)) errors.push("Unknown current roadmap node: " + current);
        }
      } catch (err) {
        errors.push("Unreadable roadmap data: " + err.message);
      }
    }
  }
  for (const [nodeId, refs] of Object.entries(p.benchSchematicRefs || {})) {
    if (!p.schematics.some(x => x.id === refs[0]) && refs.length)
      errors.push("Unrecognized schematic recommendation on " + nodeId);
    for (const ref of refs) {
      if (!p.schematics.some(x => x.id === ref)) errors.push("Unknown suggested schematic: " + ref);
    }
  }
  if (p.tutorial) {
    const lessonIds = new Set();
    const lessonSchematics = new Set();
    const nodeIds = new Set((roadmap?.nodes || []).map(n => n.id));
    const nonemptyStrings = values => Array.isArray(values) && values.length > 0 &&
      values.every(v => typeof v === "string" && v.trim());
    if (!nonemptyStrings(p.tutorial.materials)) errors.push("Missing tutorial materials: " + entry.id);
    if (typeof p.tutorial.intro !== "string" || !p.tutorial.intro.trim())
      errors.push("Missing tutorial introduction: " + entry.id);
    if (!Array.isArray(p.tutorial.lessons) || !p.tutorial.lessons.length)
      errors.push("Empty tutorial: " + entry.id);
    for (const lesson of p.tutorial.lessons || []) {
      if (lessonIds.has(lesson.id)) errors.push("Duplicate tutorial lesson: " + lesson.id);
      lessonIds.add(lesson.id);
      for (const field of ["id", "title", "goal", "concept", "diagramAlt", "transfer"])
        if (typeof lesson[field] !== "string" || !lesson[field].trim())
          errors.push("Missing tutorial " + field + ": " + lesson.id);
      if (!lesson.diagram || !exists(path.join(dirname, lesson.diagram)))
        errors.push("Missing tutorial diagram: " + lesson.id);
      if (!p.schematics.some(s => s.id === lesson.schematic && s.kind === "simulation"))
        errors.push("Tutorial needs a simulation schematic: " + lesson.id);
      if (lessonSchematics.has(lesson.schematic))
        errors.push("Ambiguous tutorial schematic: " + lesson.schematic);
      lessonSchematics.add(lesson.schematic);
      if (!nodeIds.has(lesson.roadmapNode)) errors.push("Unknown tutorial roadmap node: " + lesson.id);
      for (const field of ["predict", "simulate", "build", "measure", "expected", "troubleshoot"])
        if (!nonemptyStrings(lesson[field])) errors.push("Missing tutorial " + field + ": " + lesson.id);
    }
  }
  for (const s of p.schematics) {
    if (ids.has(s.id)) errors.push("Duplicate schematic: " + s.id);
    ids.add(s.id);
    if (!exists(path.join(dirname,s.source))) errors.push("Missing schematic source: " + s.source);
    if (s.kind === "observed") {
      if (!exists(path.join(dirname,s.diagram))) errors.push("Missing diagram: " + s.diagram);
      const n = JSON.parse(read(path.join(dirname,s.source)));
      if (n.contacts) {
        const ids = new Set(n.contacts.map(c => c.id));
        if (ids.size !== n.contacts.length) errors.push("Duplicate U1 contact labels");
        if (n.observed_package?.total_contact_estimate && n.contacts.length !== n.observed_package.total_contact_estimate)
          errors.push("Chip map does not match estimated contact count");
        for (const connection of n.known_connections || []) {
          if (connection.physical_pad && !ids.has(connection.physical_pad))
            errors.push("Unknown assigned chip pad: " + connection.physical_pad);
        }
      }
      const names = new Set((n.nets || []).map(x=>x.name));
      for (const c of n.components || []) {
        for (const destination of Object.values(c.pins)) if (!names.has(destination)) errors.push("Unresolved net: " + destination);
      }
      for (const device of n.devices || []) {
        if (!exists(path.join(dirname, device.device_model)))
          errors.push("Missing device model: " + device.device_model);
      }
    } else if (s.kind === "simulation") {
      const source = read(path.join(dirname,s.source));
      if (!source.startsWith("$ ")) errors.push("Invalid CircuitJS1 header: " + s.source);
    } else errors.push("Unknown schematic kind: " + s.kind);
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Validated " + catalog.projects.length + " projects and their schematics.");
