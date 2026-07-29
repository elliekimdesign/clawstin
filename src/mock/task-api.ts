/**
 * The live coding-agent bridge (2026-07-28): the app's only real network
 * calls. Everything else in this folder is mock data; this file is the seam
 * where a prompt leaves the device, Hermes proposes a patch, and the BACKEND
 * applies it in an isolated git worktree.
 *
 * The server is `server/hermes-bridge.mjs` on :8787. Start it with
 * `API_SERVER_KEY=… node server/hermes-bridge.mjs`.
 *
 * Nothing here runs git. The bridge is the source of truth for the
 * filesystem and for every diff shown in the review card.
 */

/** iOS simulator shares the host's loopback, so 127.0.0.1 resolves. A real
 * device would need the Mac's LAN IP here instead. */
const BASE_URL = 'http://127.0.0.1:8787';

/** A coding task can spend a while in Hermes and then in tsc, so this ceiling
 * is generous — but a hung socket must never leave the composer spinning. */
const TASK_TIMEOUT_MS = 300_000;
const ACTION_TIMEOUT_MS = 120_000;

/** what the bridge returns after it has applied a patch and re-read git */
export type TaskReview = {
  taskId: string;
  /** 'review' = there is a real diff waiting; 'no_changes' = nothing to show */
  status: 'review' | 'no_changes';
  summary: string;
  changedFiles: string[];
  diff: string;
  /** `npx tsc --noEmit` output. A TYPECHECK, not a test suite: this repo has
   * no tests, and calling it one would misrepresent the signal. */
  testOutput: string;
  typecheckPassed?: boolean;
  branch?: string;
  /** What the bridge actually FOUND in the task worktree before proposing a
   * change — e.g. `present in worktree: "Your crew is ready." — src/…:1186`.
   * Shown so the reviewer can see which version was patched, since the
   * worktree comes from origin/main and may lag the local checkout. */
  retrievalLog?: string[];
  /** the ref every task worktree is cut from */
  baseRef?: string;
};

export type ApproveResult = {
  taskId: string;
  status: 'approved';
  branch: string;
  commit: string;
  url: string | null;
};

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: string };
export type Result<T> = Ok<T> | Err;

/** Shared POST: never throws, always resolves to a Result the UI can render. */
async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<Result<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // the bridge's own wording is developer-facing ("git fetch failed",
      // "API_SERVER_KEY is not configured"); the thread is a conversation, so
      // show the detail when it is useful and keep the rest in the console
      const detail =
        typeof data?.detail === 'string'
          ? data.detail
          : typeof data?.error === 'string'
            ? data.error
            : `HTTP ${response.status}`;
      console.warn('[task-api]', path, response.status, detail);
      return { ok: false, error: detail };
    }
    return { ok: true, value: data as T };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'The request timed out.' };
    }
    // the usual case in development: the bridge is not running
    return { ok: false, error: "Couldn't reach the server. Is the bridge running on port 8787?" };
  } finally {
    clearTimeout(timer);
  }
}

/** Kick off a coding task: worktree, Hermes, patch, typecheck, real git diff. */
export function requestTask(prompt: string): Promise<Result<TaskReview>> {
  return post<TaskReview>('/task', { prompt }, TASK_TIMEOUT_MS);
}

/** Approve: the ONLY path that commits and pushes. Never merges. */
export function approveTask(taskId: string): Promise<Result<ApproveResult>> {
  return post<ApproveResult>(`/task/${taskId}/approve`, {}, ACTION_TIMEOUT_MS);
}

/** Reject: deletes the worktree and the local task branch. Never pushes. */
export function rejectTask(taskId: string): Promise<Result<{ taskId: string; branch: string }>> {
  return post<{ taskId: string; branch: string }>(`/task/${taskId}/reject`, {}, ACTION_TIMEOUT_MS);
}
