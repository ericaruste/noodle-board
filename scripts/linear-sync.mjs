#!/usr/bin/env node
/**
 * Sync tickets/*.md to a Linear workspace.
 *
 * Commands: dry-run | status | next | get | set-status | push | push-one | pull-status | sync
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

const argv = process.argv.slice(2);
const command = argv[0] ?? "help";
const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
const positional = argv.filter((arg) => !arg.startsWith("--"));
const wantJson = flags.has("--json");

try {
  if (command === "dry-run") await dryRun();
  else if (command === "status") await statusCommand();
  else if (command === "next") await nextCommand();
  else if (command === "get") await getCommand(positional[1]);
  else if (command === "set-status") {
    await setStatusCommand(positional[1], positional.slice(2).join(" "), flags.has("--push"));
  } else if (command === "push") await push();
  else if (command === "push-one") await pushOne(positional[1]);
  else if (command === "pull-status") await pullStatus();
  else if (command === "sync") await syncCommand();
  else {
    console.log(`Usage: node scripts/linear-sync.mjs <command> [args] [--json] [--push]

  dry-run                 Parse and validate local tickets (no API calls)
  status                  List every ticket
  next                    Recommend the next unblocked ticket
  get <id>                Print one ticket (file, frontmatter, body)
  set-status <id> <name>  Write local status; add --push to update Linear
  push                    Bootstrap project/labels, create or update issues
  push-one <id>           Update one issue's Linear description from local markdown
  pull-status             Copy Linear workflow state into local status
  sync                    Pull remote statuses (if already synced), then push
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

function normalizeId(raw) {
  if (raw == null || String(raw).trim() === "") return "";
  const value = String(raw).trim().toUpperCase();
  const epic = value.match(/^(?:NB-)?E(\d+)$/);
  if (epic) return `NB-E${epic[1]}`;
  const issue = value.match(/^(?:NB-)?(\d+)$/);
  if (issue) return `NB-${issue[1].padStart(2, "0")}`;
  return value;
}

function isClosed(status) {
  return /^(done|canceled|cancelled)$/i.test(String(status).trim());
}

function isInProgress(status) {
  return /^in progress$/i.test(String(status).trim());
}

function unfinishedBlockers(ticket, byId) {
  return ticket.blockedBy.filter((id) => {
    const blocker = byId.get(id);
    return !blocker || !isClosed(blocker.status);
  });
}

function summarizeTicket(ticket, byId) {
  const blockers = unfinishedBlockers(ticket, byId);
  return {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    labels: ticket.labels,
    parent: ticket.parent,
    blockedBy: ticket.blockedBy,
    blocked: blockers.length > 0,
    unfinishedBlockers: blockers,
    linear_id: ticket.linearId,
    linear_url: ticket.linearUrl,
    file: rel(ticket.filePath),
    isEpic: ticket.isEpic,
  };
}

function pickNext(tickets, byId, config) {
  const order = Array.isArray(config.buildOrder) ? config.buildOrder : [];
  const inProgress = tickets.filter(
    (ticket) => !ticket.isEpic && isInProgress(ticket.status) && unfinishedBlockers(ticket, byId).length === 0,
  );
  if (inProgress.length) {
    for (const id of order) {
      const match = inProgress.find((ticket) => ticket.id === id);
      if (match) return { ticket: match, reason: "already In Progress" };
    }
    return { ticket: inProgress[0], reason: "already In Progress" };
  }

  for (const id of order) {
    const ticket = byId.get(id);
    if (!ticket || ticket.isEpic) continue;
    if (isClosed(ticket.status)) continue;
    if (unfinishedBlockers(ticket, byId).length) continue;
    return { ticket, reason: "first unblocked in buildOrder" };
  }

  const rest = tickets
    .filter((ticket) => !ticket.isEpic && !isClosed(ticket.status) && unfinishedBlockers(ticket, byId).length === 0)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  if (rest[0]) return { ticket: rest[0], reason: "first unblocked remaining ticket" };
  return { ticket: null, reason: "no unblocked tickets remaining" };
}

function findTicket(byId, rawId) {
  const id = normalizeId(rawId);
  if (!id) throw new Error("Missing ticket id (example: NB-01)");
  const ticket = byId.get(id);
  if (!ticket) {
    const known = [...byId.keys()].join(", ");
    throw new Error(`Unknown ticket "${rawId}" (normalized ${id}). Known: ${known}`);
  }
  return ticket;
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
    const label = await payload.issueLabel;
    const labelId = payload.issueLabelId ?? label?.id;
    if (!labelId) throw new Error(`Failed to create label "${spec.name}": Linear returned no id`);
    resolved[spec.name] = labelId;
    if (label) byName.set(spec.name, label);
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
      if (!issue?.id && payload.issueId) {
        issue = await client.issue(payload.issueId);
      }
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

async function pushOne(rawId) {
  const { byId } = loadTickets();
  const ticket = findTicket(byId, rawId);
  const client = await linearClient();
  const state = readState();
  if (!state.issues) state.issues = {};
  const existing = await issueRecord(client, ticket, state);
  if (!existing) {
    throw new Error(`${ticket.id} is not on Linear yet. Run npm run tickets:push first.`);
  }
  const payload = await client.updateIssue(existing.id, { description: ticket.body });
  if (!payload.success) throw new Error(`Failed to update ${ticket.id}`);
  const issue = (await payload.issue) ?? existing;
  const result = {
    id: ticket.id,
    linear_id: issue.identifier ?? ticket.linearId,
    linear_url: issue.url ?? ticket.linearUrl,
    updated: "description",
  };
  if (wantJson) {
    emit(result);
    return;
  }
  console.log(`Updated ${result.id} description → ${result.linear_id}`);
  if (result.linear_url) console.log(result.linear_url);
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
  return { updated, skipped };
}

function emit(value) {
  if (wantJson) console.log(JSON.stringify(value, null, 2));
}

async function statusCommand() {
  const { tickets, byId, config } = loadTickets();
  const rows = sortForPush(tickets).map((ticket) => summarizeTicket(ticket, byId));
  const next = pickNext(tickets, byId, config);
  if (wantJson) {
    emit({ tickets: rows, next: next.ticket ? next.ticket.id : null, nextReason: next.reason });
    return;
  }
  const idW = Math.max(6, ...rows.map((row) => row.id.length));
  const stW = Math.max(6, ...rows.map((row) => row.status.length));
  console.log(
    `${"ID".padEnd(idW)}  ${"STATUS".padEnd(stW)}  P  BLOCKED  LINEAR     TITLE`,
  );
  for (const row of rows) {
    const blocked = row.isEpic ? "-" : row.blocked ? "yes" : "no";
    const linear = row.linear_id ?? "-";
    console.log(
      `${row.id.padEnd(idW)}  ${row.status.padEnd(stW)}  ${row.priority}  ${blocked.padEnd(7)}  ${linear.padEnd(9)}  ${row.title}`,
    );
  }
  const nextLine = next.ticket
    ? `${next.ticket.id} — ${next.ticket.title} (${next.reason})`
    : next.reason;
  console.log(`\nNext: ${nextLine}`);
}

async function nextCommand() {
  const { tickets, byId, config } = loadTickets();
  const next = pickNext(tickets, byId, config);
  if (!next.ticket) {
    if (wantJson) {
      emit({ id: null, reason: next.reason });
      return;
    }
    console.log(next.reason);
    return;
  }
  const summary = summarizeTicket(next.ticket, byId);
  if (wantJson) {
    emit({ ...summary, reason: next.reason });
    return;
  }
  console.log(`${summary.id}  ${summary.title}`);
  console.log(`status: ${summary.status}  priority: ${summary.priority}  file: ${summary.file}`);
  console.log(`reason: ${next.reason}`);
  if (summary.blockedBy.length) console.log(`blockedBy: ${summary.blockedBy.join(", ")}`);
  if (summary.linear_url) console.log(summary.linear_url);
}

async function getCommand(rawId) {
  const { byId } = loadTickets();
  const ticket = findTicket(byId, rawId);
  const summary = summarizeTicket(ticket, byId);
  if (wantJson) {
    emit({ ...summary, body: ticket.body });
    return;
  }
  console.log(`file: ${summary.file}`);
  console.log(`id: ${summary.id}`);
  console.log(`title: ${summary.title}`);
  console.log(`status: ${summary.status}`);
  console.log(`priority: ${summary.priority}`);
  console.log(`labels: ${summary.labels.join(", ")}`);
  if (summary.parent) console.log(`parent: ${summary.parent}`);
  if (summary.blockedBy.length) {
    console.log(
      `blockedBy: ${summary.blockedBy.join(", ")}${summary.blocked ? ` (unfinished: ${summary.unfinishedBlockers.join(", ")})` : ""}`,
    );
  }
  if (summary.linear_id) console.log(`linear_id: ${summary.linear_id}`);
  if (summary.linear_url) console.log(`linear_url: ${summary.linear_url}`);
  console.log("");
  process.stdout.write(ticket.body);
}

function writeTicketStatus(ticket, status) {
  const nextRaw = setFrontmatterFields(ticket.raw, { status });
  fs.writeFileSync(ticket.filePath, nextRaw, "utf8");
  ticket.raw = nextRaw;
  ticket.status = status;
}

async function pushOneStatus(ticket, status) {
  const client = await linearClient();
  const state = readState();
  const record = state.issues[ticket.id];
  const identifier = ticket.linearId || record?.identifier;
  if (!identifier && !record?.id) {
    console.log(`No Linear id for ${ticket.id} yet; running full push.`);
    await push();
    return;
  }
  const team = await resolveTeam(client);
  const statesByName = await workflowStatesByName(team);
  const workflow = matchState(statesByName, status);
  if (!workflow) {
    throw new Error(
      `No workflow state named "${status}" on team ${team.key}. Local file was still updated.`,
    );
  }
  const payload = await client.updateIssue(record?.id || identifier, { stateId: workflow.id });
  if (!payload.success) throw new Error(`Failed to update Linear status for ${ticket.id}`);
  const issue = (await payload.issue) ?? (await client.issue(record?.id || identifier));
  console.log(`Linear ${issue.identifier ?? identifier}: ${status}`);
}

async function setStatusCommand(rawId, status, shouldPush) {
  const name = String(status ?? "").trim();
  if (!name) throw new Error('Missing status (example: set-status NB-01 "In Progress")');
  const { byId } = loadTickets();
  const ticket = findTicket(byId, rawId);
  const previous = ticket.status;
  writeTicketStatus(ticket, name);
  const payload = {
    id: ticket.id,
    previous,
    status: name,
    file: rel(ticket.filePath),
    pushed: false,
  };
  if (!shouldPush) {
    if (wantJson) emit(payload);
    else console.log(`${ticket.id}: ${previous} → ${name} (${rel(ticket.filePath)})`);
    return;
  }
  if (!process.env.LINEAR_API_KEY?.trim()) {
    payload.warning = "LINEAR_API_KEY missing; local status updated only";
    if (wantJson) emit(payload);
    else {
      console.log(`${ticket.id}: ${previous} → ${name} (${rel(ticket.filePath)})`);
      console.warn(payload.warning);
    }
    return;
  }
  await pushOneStatus(ticket, name);
  payload.pushed = true;
  payload.linear_id = ticket.linearId;
  if (wantJson) emit(payload);
  else console.log(`${ticket.id}: ${previous} → ${name} (local + Linear)`);
}

async function syncCommand() {
  const { tickets } = loadTickets();
  const alreadySynced = tickets.some((ticket) => ticket.linearId);
  if (alreadySynced) {
    console.log("Pulling Linear statuses…");
    await pullStatus();
  } else {
    console.log("No linear_id values yet; skipping pull.");
  }
  await push();
}
