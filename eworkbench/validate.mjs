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
  if (p.id !== entry.id) errors.push("Project ID mismatch: " + entry.id);
  const ids = new Set();
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
