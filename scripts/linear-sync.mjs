#!/usr/bin/env node
/**
 * Sync tickets/*.md to a Linear workspace.
 *
 * Commands: dry-run | push | pull-status
 * Auth: LINEAR_API_KEY in .env (no Bearer prefix; @linear/sdk handles the header).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TICKETS_DIR = path.join(ROOT, "tickets");
const CONFIG_PATH = path.join(TICKETS_DIR, "linear.config.json");
const STATE_PATH = path.join(TICKETS_DIR, ".sync-state.json");

const PRIORITY_LABELS = { 0: "none", 1: "urgent", 2: "high", 3: "medium", 4: "low" };

loadEnv(path.join(ROOT, ".env"));

const command = process.argv[2] ?? "help";

try {
  if (command === "dry-run") await dryRun();
  else if (command === "push") await push();
  else if (command === "pull-status") await pullStatus();
  else {
    console.log(`Usage: node scripts/linear-sync.mjs <dry-run|push|pull-status>

  dry-run       Parse and validate local tickets (no API calls)
  push          Bootstrap project/labels, create or update issues, write IDs back
  pull-status   Copy Linear workflow state into local frontmatter status
`);
    process.exit(command === "help" || command === "--help" ? 0 : 1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return { teamId: null, projectId: null, labels: {}, issues: {} };
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}

function writeState(state) {
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function listTicketFiles() {
  const files = [];
  const skip = new Set(["readme.md"]);
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".md")) continue;
      if (entry.name.startsWith("_")) continue;
      if (skip.has(entry.name.toLowerCase())) continue;
      files.push(full);
    }
  };
  walk(TICKETS_DIR);
  return files.sort();
}

function parseYamlValue(raw) {
  const value = raw.trim();
  if (value === "" || value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
  }
  return value.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${rel(filePath)}: missing YAML frontmatter delimited by ---`);
  }
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon === -1) {
      throw new Error(`${rel(filePath)}: invalid frontmatter line "${line}"`);
    }
    meta[line.slice(0, colon).trim()] = parseYamlValue(line.slice(colon + 1));
  }
  return { meta, body: match[2].replace(/^\r?\n/, "").trimEnd() + "\n" };
}

function setFrontmatterFields(raw, fields) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)$/);
  if (!match) throw new Error("missing frontmatter");
  let fm = match[1];
  const rest = match[2];
  for (const [key, value] of Object.entries(fields)) {
    const line = `${key}: ${value}`;
    const re = new RegExp(`^${escapeRegExp(key)}:.*$`, "m");
    if (re.test(fm)) fm = fm.replace(re, line);
    else fm += `\n${line}`;
  }
  return `---\n${fm}\n---${rest}`;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function asList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [String(value)];
}

function loadTickets() {
  const config = readConfig();
  const allowedLabels = new Set(config.labels.map((label) => label.name));
  const tickets = [];

  for (const filePath of listTicketFiles()) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontmatter(raw, filePath);
    const labels = asList(meta.labels);
    const ticket = {
      filePath,
      raw,
      body,
      id: meta.id != null ? String(meta.id) : "",
      title: meta.title != null ? String(meta.title) : "",
      status: meta.status != null ? String(meta.status) : "",
      priority: meta.priority,
      labels,
      parent: meta.parent ? String(meta.parent) : null,
      blockedBy: asList(meta.blockedBy),
      estimate: meta.estimate == null || meta.estimate === "" ? null : Number(meta.estimate),
      linearId: meta.linear_id ? String(meta.linear_id) : null,
      linearUrl: meta.linear_url ? String(meta.linear_url) : null,
      isEpic: labels.includes("Epic"),
    };
    tickets.push(ticket);
  }

  const errors = [];
  const byId = new Map();
  for (const ticket of tickets) {
    const loc = rel(ticket.filePath);
    if (!ticket.id) errors.push(`${loc}: missing id`);
    if (!ticket.title) errors.push(`${loc}: missing title`);
    if (!ticket.status) errors.push(`${loc}: missing status`);
    if (!Number.isInteger(ticket.priority) || ticket.priority < 0 || ticket.priority > 4) {
      errors.push(`${loc}: priority must be integer 0–4`);
    }
    if (!ticket.labels.length) errors.push(`${loc}: labels must be a non-empty list`);
    for (const label of ticket.labels) {
      if (!allowedLabels.has(label)) {
        errors.push(`${loc}: unknown label "${label}"`);
      }
    }
    if (byId.has(ticket.id)) {
      errors.push(`${loc}: duplicate id ${ticket.id} (also ${rel(byId.get(ticket.id).filePath)})`);
    } else {
      byId.set(ticket.id, ticket);
    }
  }

  for (const ticket of tickets) {
    const loc = rel(ticket.filePath);
    if (ticket.parent) {
      if (!byId.has(ticket.parent)) errors.push(`${loc}: parent ${ticket.parent} not found`);
      if (ticket.parent === ticket.id) errors.push(`${loc}: parent cannot be self`);
    } else if (!ticket.isEpic) {
      errors.push(`${loc}: non-epic tickets need a parent`);
    }
    for (const blocker of ticket.blockedBy) {
      if (!byId.has(blocker)) errors.push(`${loc}: blockedBy ${blocker} not found`);
      if (blocker === ticket.id) errors.push(`${loc}: blockedBy cannot be self`);
    }
  }

  if (errors.length) {
    throw new Error(`Ticket validation failed:\n- ${errors.join("\n- ")}`);
  }

  return { config, tickets, byId };
}

function sortForPush(tickets) {
  return [...tickets].sort((a, b) => {
    if (a.isEpic !== b.isEpic) return a.isEpic ? -1 : 1;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

async function dryRun() {
  const { tickets } = loadTickets();
  const epics = tickets.filter((ticket) => ticket.isEpic);
  const issues = tickets.filter((ticket) => !ticket.isEpic);
  console.log(`Valid: ${tickets.length} tickets (${epics.length} epics, ${issues.length} issues)\n`);

  for (const ticket of sortForPush(tickets)) {
    const action = ticket.linearId ? "update" : "create";
    const parent = ticket.parent ? ` parent=${ticket.parent}` : "";
    const blocked = ticket.blockedBy.length ? ` blockedBy=${ticket.blockedBy.join(",")}` : "";
    const ident = ticket.linearId ? ` ${ticket.linearId}` : "";
    console.log(
      `  ${action.padEnd(6)} ${ticket.id}  ${ticket.title}  [${ticket.labels.join(", ")}]  P${ticket.priority} (${PRIORITY_LABELS[ticket.priority]})${parent}${blocked}${ident}`,
    );
  }

  const relations = tickets.flatMap((ticket) =>
    ticket.blockedBy.map((blocker) => `  ${blocker} blocks ${ticket.id}`),
  );
  if (relations.length) {
    console.log("\nRelations:");
    console.log(relations.join("\n"));
  }
}

async function linearClient() {
  const apiKey = process.env.LINEAR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "LINEAR_API_KEY is missing. Copy .env.example to .env and add a personal API key (Settings → Account → Security & access).",
    );
  }
  const { LinearClient } = await import("@linear/sdk");
  return new LinearClient({ apiKey });
}

async function nodesOf(connection) {
  if (!connection) return [];
  if (Array.isArray(connection.nodes)) return connection.nodes;
  return [];
}

async function resolveTeam(client) {
  const key = process.env.LINEAR_TEAM_KEY?.trim();
  if (key) {
    const team = await client.team(key);
    if (!team?.id) throw new Error(`Linear team "${key}" not found`);
    return team;
  }
  const connection = await client.teams({ first: 50 });
  const teams = await nodesOf(connection);
  if (!teams.length) {
    throw new Error("This Linear workspace has no teams. Finish workspace onboarding first.");
  }
  if (teams.length > 1) {
    console.warn(
      `Multiple teams found; using "${teams[0].name}" (${teams[0].key}). Set LINEAR_TEAM_KEY to pick another.`,
    );
  }
  return teams[0];
}

async function resolveProject(client, team, config) {
  const name = process.env.LINEAR_PROJECT?.trim() || config.project;
  const connection = await client.projects({
    first: 100,
    filter: { name: { eq: name } },
  });
  const existing = (await nodesOf(connection)).find((project) => project.name === name);
  if (existing) {
    console.log(`Project: ${existing.name} (${existing.id})`);
    return existing;
  }
  const payload = await client.createProject({
    name,
    description: config.projectDescription ?? "",
    teamIds: [team.id],
  });
  if (!payload.success) throw new Error(`Failed to create project "${name}"`);
  const project = await payload.project;
  console.log(`Created project: ${project.name} (${project.id})`);
  return project;
}

async function resolveLabels(client, config) {
  const connection = await client.issueLabels({ first: 250 });
  const existing = await nodesOf(connection);
  const byName = new Map(existing.map((label) => [label.name, label]));
  const resolved = {};

  for (const spec of config.labels) {
    const found = byName.get(spec.name);
    if (found) {
      resolved[spec.name] = found.id;
      continue;
    }
    const payload = await client.createIssueLabel({
      name: spec.name,
      color: spec.color,
      description: spec.description ?? "",
    });
    if (!payload.success) throw new Error(`Failed to create label "${spec.name}"`);
    const label = await payload.label;
    resolved[spec.name] = label.id;
    byName.set(spec.name, label);
    console.log(`Created label: ${spec.name}`);
  }
  return resolved;
}

async function workflowStatesByName(team) {
  const connection = await team.states({ first: 50 });
  const states = await nodesOf(connection);
  const map = new Map();
  for (const state of states) {
    map.set(state.name.toLowerCase(), state);
  }
  return map;
}

function matchState(statesByName, status) {
  const key = status.trim().toLowerCase();
  return statesByName.get(key) ?? null;
}

async function issueRecord(client, ticket, state) {
  const cached = state.issues[ticket.id];
  const identifier = ticket.linearId || cached?.identifier;
  if (!identifier && !cached?.id) return null;
  try {
    return await client.issue(cached?.id || identifier);
  } catch {
    return null;
  }
}

async function existingBlockRelations(issue) {
  const ids = new Set();
  try {
    const connection = await issue.relations();
    for (const relation of await nodesOf(connection)) {
      const type = relation.type;
      if (type !== "blocks") continue;
      const related = await relation.relatedIssue;
      if (related?.id) ids.add(related.id);
    }
  } catch {
    // Relation fetch is best-effort; push will try to create and ignore dupes.
  }
  return ids;
}

async function push() {
  const { config, tickets, byId } = loadTickets();
  const client = await linearClient();
  const viewer = await client.viewer;
  console.log(`Authenticated as ${viewer.name}${viewer.email ? ` (${viewer.email})` : ""}`);

  const state = readState();
  const team = await resolveTeam(client);
  console.log(`Team: ${team.name} (${team.key})`);
  const project = await resolveProject(client, team, config);
  const labelIds = await resolveLabels(client, config);
  const statesByName = await workflowStatesByName(team);

  state.teamId = team.id;
  state.projectId = project.id;
  state.labels = labelIds;
  if (!state.issues) state.issues = {};

  for (const ticket of sortForPush(tickets)) {
    const stateId = matchState(statesByName, ticket.status)?.id;
    if (!stateId) {
      console.warn(`  ${ticket.id}: no workflow state named "${ticket.status}" on team ${team.key}; leaving Linear status unchanged`);
    }

    const parentUuid = ticket.parent ? state.issues[ticket.parent]?.id : undefined;
    if (ticket.parent && !parentUuid) {
      throw new Error(`${ticket.id}: parent ${ticket.parent} has not been synced yet`);
    }

    const input = {
      teamId: team.id,
      title: ticket.title,
      description: ticket.body,
      projectId: project.id,
      labelIds: ticket.labels.map((name) => labelIds[name]).filter(Boolean),
      priority: ticket.priority,
    };
    if (stateId) input.stateId = stateId;
    if (parentUuid) input.parentId = parentUuid;
    if (ticket.estimate != null && !Number.isNaN(ticket.estimate)) {
      input.estimate = ticket.estimate;
    }

    const existing = await issueRecord(client, ticket, state);
    let issue = existing;
    if (existing) {
      const { teamId: _ignoredTeamId, ...update } = input;
      const payload = await client.updateIssue(existing.id, update);
      if (!payload.success) throw new Error(`Failed to update ${ticket.id}`);
      issue = (await payload.issue) ?? existing;
      console.log(`Updated ${ticket.id} → ${issue.identifier}`);
    } else {
      const payload = await client.createIssue(input);
      if (!payload.success) throw new Error(`Failed to create ${ticket.id}`);
      issue = await payload.issue;
      if (!issue?.id || !issue.identifier) {
        throw new Error(`Failed to create ${ticket.id}: Linear returned no issue`);
      }
      console.log(`Created ${ticket.id} → ${issue.identifier}`);
    }

    const url = issue.url;
    state.issues[ticket.id] = {
      id: issue.id,
      identifier: issue.identifier,
      url,
    };
    ticket.linearId = issue.identifier;
    ticket.linearUrl = url;
    const nextRaw = setFrontmatterFields(ticket.raw, {
      linear_id: issue.identifier,
      linear_url: url,
    });
    fs.writeFileSync(ticket.filePath, nextRaw, "utf8");
    ticket.raw = nextRaw;
    writeState(state);
  }

  for (const ticket of tickets) {
    const blocked = state.issues[ticket.id];
    if (!blocked) continue;
    for (const blockerId of ticket.blockedBy) {
      const blocker = state.issues[blockerId];
      if (!blocker) {
        console.warn(`  skip relation ${blockerId} blocks ${ticket.id}: blocker not synced`);
        continue;
      }
      const blockerIssue = await client.issue(blocker.id);
      const relatedIds = await existingBlockRelations(blockerIssue);
      if (relatedIds.has(blocked.id)) continue;
      try {
        const payload = await client.createIssueRelation({
          issueId: blocker.id,
          relatedIssueId: blocked.id,
          type: "blocks",
        });
        if (payload.success) {
          console.log(`Relation: ${blockerId} blocks ${ticket.id}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/already|duplicate|exists/i.test(message)) continue;
        console.warn(`  relation ${blockerId} blocks ${ticket.id}: ${message}`);
      }
    }
  }

  writeState(state);
  console.log(`\nPush complete. ${tickets.length} issues in project "${project.name}".`);
}

async function pullStatus() {
  const { tickets } = loadTickets();
  const client = await linearClient();
  const state = readState();
  let updated = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    const record = state.issues[ticket.id];
    const identifier = ticket.linearId || record?.identifier;
    if (!identifier && !record?.id) {
      console.warn(`  ${ticket.id}: not synced yet, skip`);
      skipped += 1;
      continue;
    }
    const issue = await client.issue(record?.id || identifier);
    const workflow = await issue.state;
    const name = workflow?.name;
    if (!name) {
      console.warn(`  ${ticket.id}: Linear issue has no state`);
      skipped += 1;
      continue;
    }
    if (name === ticket.status) continue;
    const nextRaw = setFrontmatterFields(ticket.raw, { status: name });
    fs.writeFileSync(ticket.filePath, nextRaw, "utf8");
    console.log(`  ${ticket.id}: ${ticket.status} → ${name}`);
    updated += 1;
  }

  console.log(`\nPull-status complete. Updated ${updated}, skipped ${skipped}.`);
}
