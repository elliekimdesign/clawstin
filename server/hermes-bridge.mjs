import http from 'node:http';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const HOST = '127.0.0.1';
const PORT = 8787;
/** overridable so the bridge can be pointed at a stand-in during testing */
const HERMES_URL = process.env.HERMES_URL ?? 'http://127.0.0.1:8642/v1/chat/completions';

/** the repository this bridge operates on — every worktree is cut from here */
const REPO = '/Users/seohyunkim/Documents/clawstin';

/** How much of the repo we are willing to show Hermes in one task. Bounded so
 * the request stays fast and inside the model's context window. */
const MAX_FILES = 12;
const MAX_TOTAL_CHARS = 24_000;
/** a single file bigger than this is never a good candidate for a focused fix */
const MAX_FILE_CHARS = 12_000;

/** Only ever read and patch source text. Anything else (images, fonts, lock
 * files, binaries) is rejected outright — see assertPatchable. */
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.css', '.svg', '.txt', '.yml', '.yaml',
]);

/** directories that never contain the source of a bug fix */
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'ios', 'android', 'assets', 'dist', 'build']);

/** In-memory task registry: taskId -> { worktree, branch, changedFiles, prompt }.
 * A bridge restart forgets pending tasks; acceptable for this MVP, and the
 * orphaned worktrees are still visible via `git worktree list`. */
const tasks = new Map();

const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return JSON.parse(body);
}

/** Run a command and always resolve: callers decide what a non-zero exit means.
 * Never uses a shell, so no argument can be interpreted as shell syntax. */
async function run(cmd, args, opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd: opts.cwd ?? REPO,
      maxBuffer: 20 * 1024 * 1024,
      timeout: opts.timeout ?? 120_000,
      env: process.env,
    });
    return { ok: true, code: 0, stdout, stderr };
  } catch (error) {
    return {
      ok: false,
      code: typeof error.code === 'number' ? error.code : 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? String(error.message ?? error),
    };
  }
}

const git = (args, cwd) => run('git', args, { cwd });

// ───────────────────────────── phrase retrieval ─────────────────────────────

/** Phrases a user may refer to interchangeably, because the wording has
 * changed over time and their local checkout may be ahead of origin/main.
 * The worktree is ALWAYS the source of truth — a request naming any variant
 * is resolved against whichever one actually exists there.
 *
 * (2026-07-28: a user asking about "Your crew is standing by." would
 * otherwise retrieve nothing, since origin/main still says "ready.") */
const PHRASE_VARIANTS = [
  ['Your crew is ready.', 'Your crew is standing by.', 'Your crew is ready when you are.'],
];

/** Pull quoted phrases out of the prompt, straight or curly quotes. */
function quotedPhrases(prompt) {
  const out = [];
  for (const m of prompt.match(/"([^"]{3,80})"|“([^”]{3,80})”/g) ?? []) {
    out.push(m.replace(/^["“]|["”]$/g, ''));
  }
  return out;
}

/** Every phrase worth searching for: what the user quoted, plus any known
 * variants of it. Lets "standing by" find the "ready." line and vice versa. */
function expandPhrases(prompt) {
  const asked = quotedPhrases(prompt);
  const expanded = new Set(asked);
  for (const phrase of asked) {
    for (const group of PHRASE_VARIANTS) {
      if (group.some((v) => v.toLowerCase() === phrase.toLowerCase())) {
        for (const v of group) expanded.add(v);
      }
    }
  }
  return { asked, all: Array.from(expanded) };
}

/**
 * Search the TASK WORKTREE (never the user's dirty checkout) for each phrase
 * and report which one is actually present. This is what makes the retrieval
 * honest: the demo log states the version in the worktree rather than
 * assuming the user's wording matches origin/main.
 */
async function probePhrases(worktree, prompt) {
  const { asked, all } = expandPhrases(prompt);
  if (all.length === 0) return { asked: [], found: [], missing: [], log: [] };

  const found = [];
  const missing = [];

  for (const phrase of all) {
    // -F fixed string, -n line numbers: no regex surprises from punctuation
    const hit = await git(['grep', '-F', '-n', '--', phrase], worktree);
    if (hit.ok && hit.stdout.trim()) {
      const [first] = hit.stdout.trim().split('\n');
      const [file, line] = first.split(':');
      found.push({ phrase, file, line: Number(line), occurrences: hit.stdout.trim().split('\n').length });
    } else {
      missing.push(phrase);
    }
  }

  const log = [];
  for (const f of found) {
    log.push(`present in worktree: "${f.phrase}" — ${f.file}:${f.line}`);
  }
  for (const m of missing) {
    log.push(`not in worktree: "${m}"`);
  }
  // the correction the user cares about: they asked for X, the worktree has Y
  for (const a of asked) {
    if (missing.some((m) => m === a) && found.length > 0) {
      log.push(
        `note: you referred to "${a}", but this task's worktree (from origin/main) contains "${found[0].phrase}" — resolving against that.`
      );
    }
  }
  return { asked, found, missing, log };
}

// ───────────────────────── demo pin (one use case) ─────────────────────────

/** THE DEMO USE CASE (2026-07-28), deliberately narrow: a request about the
 * New Task screen's empty-state line must always see the file that holds it.
 * Generic keyword retrieval had dropped this file for being 76KB against the
 * 12KB budget — so the one file the task needed was the one file missing. */
const DEMO_PIN = {
  file: 'src/app/chat/[id].tsx',
  phrases: ['Your crew is ready.', 'Your crew is standing by.'],
  /** any of these in the prompt also means "the New Task screen" */
  topics: ['new task', 'newtask', 'empty state', 'empty-state', 'crew is'],
};

function wantsDemoPin(prompt) {
  const lower = prompt.toLowerCase();
  if (DEMO_PIN.phrases.some((p) => lower.includes(p.toLowerCase()))) return true;
  return DEMO_PIN.topics.some((t) => lower.includes(t));
}

/** A 76KB file blows the payload budget, so send a WINDOW around the line
 * Hermes must copy. The excerpt keeps whole lines and is marked as partial so
 * the model does not assume it is seeing the entire file. */
function excerptAround(content, phrases, budget) {
  const lines = content.split('\n');
  let hit = -1;
  for (const phrase of phrases) {
    hit = lines.findIndex((l) => l.includes(phrase));
    if (hit !== -1) break;
  }
  if (hit === -1) return content.slice(0, budget);

  // roughly budget/2 chars either side, counted in lines
  let start = hit;
  let end = hit;
  let size = lines[hit].length;
  while (size < budget && (start > 0 || end < lines.length - 1)) {
    if (start > 0) {
      start--;
      size += lines[start].length + 1;
    }
    if (size < budget && end < lines.length - 1) {
      end++;
      size += lines[end].length + 1;
    }
  }
  const head = start > 0 ? `… lines 1-${start} omitted …\n` : '';
  const tail = end < lines.length - 1 ? `\n… lines ${end + 2}-${lines.length} omitted …` : '';
  return `${head}${lines.slice(start, end + 1).join('\n')}${tail}`;
}

// ───────────────────────────── file selection ─────────────────────────────

/** Rank the worktree's tracked text files against the prompt's keywords. The
 * point is a BOUNDED, relevant slice — not the whole repo. */
async function selectFiles(worktree, prompt, probe) {
  const listed = await git(['ls-files'], worktree);
  if (!listed.ok) return [];

  // phrases that REALLY exist in this worktree (variant-resolved), so a
  // request naming one wording still retrieves the file holding the other
  const presentPhrases = (probe?.found ?? []).map((f) => f.phrase.toLowerCase());
  const presentFiles = new Set((probe?.found ?? []).map((f) => f.file));

  const words = Array.from(
    new Set(
      prompt
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .filter((w) => w.length >= 3)
    )
  );

  const candidates = listed.stdout
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => TEXT_EXTENSIONS.has(path.extname(p)))
    .filter((p) => !p.split('/').some((seg) => SKIP_DIRS.has(seg)));

  const scored = [];
  for (const rel of candidates) {
    const hay = rel.toLowerCase();
    // path relevance first: a filename match is the strongest cheap signal
    let score = words.reduce((n, w) => (hay.includes(w) ? n + 5 : n), 0);

    let content = null;
    try {
      const stat = await fs.stat(path.join(worktree, rel));
      if (stat.size > MAX_FILE_CHARS * 2) continue;
      content = await fs.readFile(path.join(worktree, rel), 'utf8');
    } catch {
      continue;
    }
    if (content.includes('\u0000') || content.length > MAX_FILE_CHARS) continue;

    const lower = content.toLowerCase();
    for (const w of words) if (lower.includes(w)) score += 1;

    // A phrase CONFIRMED to exist in this worktree is the strongest signal
    // there is — it outranks everything else, so the file holding the real
    // line is always in the payload even when the user quoted a variant.
    if (presentFiles.has(rel)) score += 100;
    for (const needle of presentPhrases) {
      if (lower.includes(needle)) score += 40;
    }

    if (score > 0) scored.push({ rel, content, score });
  }

  scored.sort((a, b) => b.score - a.score || a.content.length - b.content.length);

  const picked = [];
  let budget = MAX_TOTAL_CHARS;

  // THE PINNED FILE GOES FIRST (2026-07-28): for the demo use case it is
  // guaranteed into the payload regardless of size or keyword score, as an
  // excerpt around the target line.
  if (wantsDemoPin(prompt)) {
    try {
      const raw = await fs.readFile(path.join(worktree, DEMO_PIN.file), 'utf8');
      const phrases = (probe?.found ?? []).map((f) => f.phrase);
      const content =
        raw.length > MAX_FILE_CHARS
          ? excerptAround(raw, phrases.length ? phrases : DEMO_PIN.phrases, MAX_FILE_CHARS)
          : raw;
      picked.push({ rel: DEMO_PIN.file, content, score: 1000, pinned: true });
      budget -= content.length;
    } catch {
      // the pin is a convenience, never a hard failure
    }
  }

  for (const f of scored) {
    if (picked.length >= MAX_FILES) break;
    if (picked.some((p) => p.rel === f.rel)) continue;
    if (f.content.length > budget) continue;
    picked.push(f);
    budget -= f.content.length;
  }
  return picked;
}

// ───────────────────────────── hermes ─────────────────────────────

const SYSTEM_PROMPT = `You are a careful coding agent working on a React Native (Expo) repository.

You will receive a user request and the contents of candidate files.

Reply with ONLY a JSON object, no prose and no code fences, shaped exactly:
{
  "summary": "one or two sentences describing what you changed and why",
  "changes": [
    { "path": "relative/path.tsx", "original": "exact text to replace", "replacement": "new text" }
  ],
  "suggestedCheck": "npx tsc --noEmit"
}

Hard rules:
- "original" MUST be copied character-for-character from the file shown to you, including indentation.
- "original" MUST appear EXACTLY ONCE in that file. Include surrounding lines to make it unique.
- Use only relative paths from the files you were shown. Never invent a path.
- Make the smallest change that satisfies the request.
- If you cannot do it safely, return an empty "changes" array and explain why in "summary".`;

async function askHermes(prompt, files, apiKey, probe) {
  const fileBlocks = files
    .map((f) => `--- FILE: ${f.rel} ---\n${f.content}`)
    .join('\n\n');

  // Hand the model the RETRIEVAL FACTS, so it patches the wording that is
  // really in this worktree instead of the wording the user happened to
  // quote. Without this, a request naming a newer local phrasing produces an
  // "original" that does not exist, and the bridge rejects the whole plan.
  const retrieval = probe?.found?.length
    ? `RETRIEVAL (verified in this worktree):\n${probe.found
        .map((f) => `- "${f.phrase}" exists at ${f.file}:${f.line}`)
        .join('\n')}${
        probe.missing.length
          ? `\nNot present here: ${probe.missing.map((m) => `"${m}"`).join(', ')}`
          : ''
      }\nIf the request names a phrase that is not present, treat the present one above as the intended target.\n\n`
    : '';

  const userContent = `USER REQUEST:\n${prompt}\n\n${retrieval}CANDIDATE FILES:\n\n${fileBlocks}`;

  const hermesResponse = await fetch(HERMES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'hermes-agent',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      stream: false,
    }),
  });

  const raw = await hermesResponse.json();
  if (!hermesResponse.ok) {
    throw Object.assign(new Error('Hermes request failed'), { raw, status: hermesResponse.status });
  }

  const text = raw.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw Object.assign(new Error('Hermes response had no message content'), { raw });
  }
  return parsePlan(text);
}

/** Models often wrap JSON in prose or fences; recover the object without ever
 * eval-ing it. Throws if the result is not the shape we require. */
function parsePlan(text) {
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidate = fence[1].trim();
  if (!candidate.startsWith('{')) {
    const first = candidate.indexOf('{');
    const last = candidate.lastIndexOf('}');
    if (first !== -1 && last > first) candidate = candidate.slice(first, last + 1);
  }

  let plan;
  try {
    plan = JSON.parse(candidate);
  } catch {
    throw new Error('Hermes did not return valid JSON');
  }
  if (typeof plan.summary !== 'string') throw new Error('Plan is missing "summary"');
  if (!Array.isArray(plan.changes)) throw new Error('Plan is missing "changes"');
  return plan;
}

// ───────────────────────────── patch validation ─────────────────────────────

/** Reject anything that could write outside the worktree or corrupt a binary.
 * Runs BEFORE any write, and the caller applies changes only if every one of
 * them passes (all-or-nothing). */
async function assertPatchable(worktree, change) {
  const { path: rel, original, replacement } = change;

  if (typeof rel !== 'string' || !rel.trim()) throw new Error('change.path must be a non-empty string');
  if (typeof original !== 'string' || original.length === 0) {
    throw new Error(`change.original must be a non-empty string (${rel})`);
  }
  if (typeof replacement !== 'string') throw new Error(`change.replacement must be a string (${rel})`);

  if (path.isAbsolute(rel)) throw new Error(`Absolute paths are not allowed: ${rel}`);
  if (rel.split(/[\\/]/).includes('..')) throw new Error(`Parent traversal is not allowed: ${rel}`);
  if (!TEXT_EXTENSIONS.has(path.extname(rel))) throw new Error(`Not an editable text file: ${rel}`);
  if (rel.split('/').some((seg) => SKIP_DIRS.has(seg))) throw new Error(`Path is out of scope: ${rel}`);

  const target = path.join(worktree, rel);

  // realpath catches symlinks that escape the worktree — a string prefix check
  // alone would not. The worktree root is realpath'd too so /tmp vs /private/tmp
  // on macOS does not produce a false mismatch.
  const rootReal = await fs.realpath(worktree);
  let targetReal;
  try {
    targetReal = await fs.realpath(target);
  } catch {
    throw new Error(`File does not exist in the worktree: ${rel}`);
  }
  if (targetReal !== rootReal && !targetReal.startsWith(rootReal + path.sep)) {
    throw new Error(`Resolved path escapes the worktree: ${rel}`);
  }

  const stat = await fs.stat(targetReal);
  if (!stat.isFile()) throw new Error(`Not a regular file: ${rel}`);

  const content = await fs.readFile(targetReal, 'utf8');
  if (content.includes('\u0000')) throw new Error(`Refusing to patch binary content: ${rel}`);

  // exact-match contract: zero occurrences means Hermes hallucinated the
  // original; multiple means the edit is ambiguous. Both are failures.
  const occurrences = content.split(original).length - 1;
  if (occurrences === 0) throw new Error(`"original" was not found in ${rel}`);
  if (occurrences > 1) throw new Error(`"original" appears ${occurrences} times in ${rel}; it must be unique`);

  return { targetReal, content };
}

// ───────────────────────────── ground truth ─────────────────────────────

/** Everything the frontend shows comes from THIS function — real git output
 * read from the worktree — never from anything Hermes claimed in prose. */
async function collectGroundTruth(worktree) {
  const status = await git(['status', '--short'], worktree);
  const diff = await git(['diff'], worktree);
  const changed = await git(['diff', '--name-only'], worktree);

  return {
    statusShort: status.stdout.trim(),
    diff: diff.stdout,
    changedFiles: changed.stdout.split('\n').map((s) => s.trim()).filter(Boolean),
  };
}

async function runTypecheck(worktree) {
  // a fresh worktree has no node_modules, which makes tsc emit hundreds of
  // false "Cannot find module" errors. Borrowing the main repo's install is
  // what makes the check meaningful (verified 2026-07-28).
  const link = path.join(worktree, 'node_modules');
  try {
    await fs.symlink(path.join(REPO, 'node_modules'), link, 'dir');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      return { output: `Could not prepare node_modules: ${error.message}`, passed: false };
    }
  }

  const tsc = await run(path.join(REPO, 'node_modules/.bin/tsc'), ['--noEmit'], {
    cwd: worktree,
    timeout: 300_000,
  });

  const output = `${tsc.stdout}${tsc.stderr}`.trim();
  return {
    passed: tsc.code === 0,
    output: output || (tsc.code === 0 ? 'No type errors.' : `Typecheck exited with code ${tsc.code}.`),
  };
}

/** the symlink is ours, not the task's work — remove it before git sees it */
async function unlinkNodeModules(worktree) {
  try {
    const link = path.join(worktree, 'node_modules');
    const stat = await fs.lstat(link);
    if (stat.isSymbolicLink()) await fs.unlink(link);
  } catch {
    /* nothing to clean up */
  }
}

// ───────────────────────────── routes ─────────────────────────────

async function handleCreateTask(body, response) {
  if (typeof body?.prompt !== 'string' || !body.prompt.trim()) {
    sendJson(response, 400, { error: 'prompt must be a non-empty string' });
    return;
  }
  const apiKey = process.env.API_SERVER_KEY;
  if (!apiKey) {
    sendJson(response, 500, { error: 'API_SERVER_KEY is not configured' });
    return;
  }

  const prompt = body.prompt.trim();
  const taskId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const branch = `clawstin/task-${taskId}`;
  const worktree = path.join(os.tmpdir(), `clawstin-task-${taskId}`);

  // 1. always start from the real remote tip, never from local state
  const fetched = await git(['fetch', 'origin', 'main']);
  if (!fetched.ok) {
    sendJson(response, 502, { error: 'git fetch failed', detail: fetched.stderr.trim() });
    return;
  }

  // 2. isolated worktree from origin/main — the user's uncommitted work in the
  //    main checkout is structurally excluded, not merely ignored
  const added = await git(['worktree', 'add', '-b', branch, worktree, 'origin/main']);
  if (!added.ok) {
    sendJson(response, 500, { error: 'Could not create the task worktree', detail: added.stderr.trim() });
    return;
  }

  tasks.set(taskId, { taskId, branch, worktree, prompt, changedFiles: [] });

  try {
    // WORKTREE SOURCE: the exact commit this task is built on, so the log
    // never leaves ambiguity about which version was inspected
    const head = await git(['rev-parse', 'HEAD'], worktree);
    const headSubject = await git(['log', '-1', '--pretty=%s'], worktree);
    const baseCommit = head.stdout.trim();
    console.log(
      `[task ${taskId}] worktree source: origin/main @ ${baseCommit.slice(0, 7)} — ${headSubject.stdout.trim()}`
    );
    console.log(`[task ${taskId}] worktree path: ${worktree}`);

    // 3. RETRIEVAL PROBE (2026-07-28): before asking for a change, find out
    //    which wording actually exists in THIS worktree. The user's local
    //    checkout may be ahead of origin/main, and the worktree — not their
    //    dirty working copy — is the task's source of truth.
    const probe = await probePhrases(worktree, prompt);
    for (const line of probe.log) console.log(`[task ${taskId}] ${line}`);

    // 4. bounded, relevant slice of the worktree
    const files = await selectFiles(worktree, prompt, probe);
    for (const f of files) {
      console.log(
        `[task ${taskId}] candidate: ${f.rel}${f.pinned ? ' (pinned for demo use case)' : ''} — ${f.content.length} chars`
      );
    }
    console.log(`[task ${taskId}] ${files.length} candidate file(s) sent to Hermes`);
    if (files.length === 0) {
      await unlinkNodeModules(worktree);
      sendJson(response, 200, {
        taskId,
        status: 'no_changes',
        summary: 'No files in the repository looked relevant to that request, so nothing was changed.',
        changedFiles: [],
        diff: '',
        testOutput: '',
        branch,
        retrievalLog: probe.log,
        baseRef: 'origin/main',
      });
      return;
    }

    // 5. structured plan from Hermes — proposal only, never applied blindly
    let plan;
    try {
      plan = await askHermes(prompt, files, apiKey, probe);
    } catch (error) {
      await cleanupTask(taskId);
      sendJson(response, 502, {
        error: 'Hermes could not produce a valid plan',
        detail: error.message,
      });
      return;
    }

    // 6-7. validate EVERY change before writing ANY of them
    const validated = [];
    for (const change of plan.changes) {
      try {
        const { targetReal, content } = await assertPatchable(worktree, change);
        validated.push({ change, targetReal, content });
      } catch (error) {
        await cleanupTask(taskId);
        sendJson(response, 422, {
          error: 'Hermes proposed an invalid change',
          detail: error.message,
        });
        return;
      }
    }

    // 8. apply
    for (const { change, targetReal, content } of validated) {
      await fs.writeFile(targetReal, content.replace(change.original, change.replacement), 'utf8');
    }

    // 9. typecheck (labelled as a typecheck, NOT as tests — this repo has none)
    const typecheck = await runTypecheck(worktree);
    await unlinkNodeModules(worktree);

    // 10. ground truth straight from git
    const truth = await collectGroundTruth(worktree);
    const record = tasks.get(taskId);
    if (record) record.changedFiles = truth.changedFiles;

    // 11. structured review response
    sendJson(response, 200, {
      taskId,
      status: truth.changedFiles.length > 0 ? 'review' : 'no_changes',
      summary: plan.summary,
      changedFiles: truth.changedFiles,
      diff: truth.diff,
      statusShort: truth.statusShort,
      testOutput: typecheck.output,
      typecheckPassed: typecheck.passed,
      branch,
      // what the worktree actually contained, so the UI can show WHICH
      // version was patched rather than implying the user's local wording
      retrievalLog: probe.log,
      baseRef: 'origin/main',
      baseCommit,
      candidateFiles: files.map((f) => f.rel),
    });
  } catch (error) {
    await cleanupTask(taskId);
    sendJson(response, 500, { error: 'Task failed', detail: String(error.message ?? error) });
  }
}

async function handleApprove(taskId, response) {
  const task = tasks.get(taskId);
  if (!task) {
    sendJson(response, 404, { error: 'Unknown task' });
    return;
  }

  await unlinkNodeModules(task.worktree);

  // stage ONLY this worktree's changed files, by explicit path
  const truth = await collectGroundTruth(task.worktree);
  if (truth.changedFiles.length === 0) {
    sendJson(response, 409, { error: 'There is nothing to commit for this task' });
    return;
  }

  const staged = await git(['add', '--', ...truth.changedFiles], task.worktree);
  if (!staged.ok) {
    sendJson(response, 500, { error: 'Could not stage the changes', detail: staged.stderr.trim() });
    return;
  }

  const subject = task.prompt.replace(/\s+/g, ' ').trim().slice(0, 60);
  const message = `${subject}\n\nApproved from Clawstin. Task ${task.taskId}.`;
  const committed = await git(['commit', '-m', message], task.worktree);
  if (!committed.ok) {
    sendJson(response, 500, { error: 'Commit failed', detail: committed.stderr.trim() });
    return;
  }

  const pushed = await git(['push', '-u', 'origin', task.branch], task.worktree);
  if (!pushed.ok) {
    sendJson(response, 502, { error: 'Push failed', detail: pushed.stderr.trim() });
    return;
  }

  const hash = await git(['rev-parse', 'HEAD'], task.worktree);
  const commit = hash.stdout.trim();

  const remote = await git(['remote', 'get-url', 'origin'], task.worktree);
  const httpsUrl = remote.stdout.trim().replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
  const url = httpsUrl.startsWith('https://github.com/')
    ? `${httpsUrl}/tree/${task.branch}`
    : null;

  // the branch is pushed; the worktree has done its job
  await cleanupTask(taskId, { keepBranch: true });

  sendJson(response, 200, { taskId, status: 'approved', branch: task.branch, commit, url });
}

async function handleReject(taskId, response) {
  const task = tasks.get(taskId);
  if (!task) {
    sendJson(response, 404, { error: 'Unknown task' });
    return;
  }
  await cleanupTask(taskId);
  sendJson(response, 200, { taskId, status: 'rejected', branch: task.branch });
}

/** Remove the worktree and (unless it was pushed) the local task branch.
 * Never touches the main checkout or any branch other than this task's. */
async function cleanupTask(taskId, { keepBranch = false } = {}) {
  const task = tasks.get(taskId);
  if (!task) return;
  await unlinkNodeModules(task.worktree);
  await git(['worktree', 'remove', '--force', task.worktree]);
  if (!keepBranch) await git(['branch', '-D', task.branch]);
  tasks.delete(taskId);
}

// ───────────────────────────── server ─────────────────────────────

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  const pathname = new URL(request.url ?? '/', `http://${HOST}:${PORT}`).pathname;

  if (request.method !== 'POST') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  const approve = pathname.match(/^\/task\/([\w-]+)\/approve$/);
  const reject = pathname.match(/^\/task\/([\w-]+)\/reject$/);

  try {
    if (pathname === '/task') {
      let body;
      try {
        body = await readJson(request);
      } catch {
        sendJson(response, 400, { error: 'Request body must be valid JSON' });
        return;
      }
      await handleCreateTask(body, response);
      return;
    }
    if (approve) {
      await handleApprove(approve[1], response);
      return;
    }
    if (reject) {
      await handleReject(reject[1], response);
      return;
    }
    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(response, 500, { error: 'Bridge error', detail: String(error.message ?? error) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Hermes bridge listening on http://${HOST}:${PORT}`);
  console.log(`repo: ${REPO}`);
});
