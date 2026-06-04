import { DEFAULT_REQUEST } from "./events";
import { PROOF_PATH, PROOF_SCRIPT, WORKSPACE_DIR } from "./scratch";

/**
 * A deliberately prescriptive prompt: the more exact we are about filenames,
 * the no-network/no-build constraints, and the single screenshot command, the
 * more reliably the agent produces a working app + proof inside a few minutes.
 */
export function buildPrompt(userRequest: string): string {
  const req = (userRequest || "").trim() || DEFAULT_REQUEST;
  return `You are an agent that builds a small web app from a single spoken request, then verifies it works by taking a screenshot of the running app. Work ENTIRELY inside the current working directory.

REQUEST: "${req}"

Follow these steps exactly and narrate briefly as you go:

1. Create exactly three files in the current directory: index.html, styles.css, and app.js.
   - Use plain HTML, CSS, and vanilla JavaScript only. No frameworks, no bundlers, no build step, and DO NOT run npm install.
   - Do NOT use fetch, network requests, or ES module imports. Load the script with a classic tag: <script src="app.js"></script>.
   - Fully implement the request. Make it clean, modern, and visually polished so a screenshot looks impressive.

2. Verify the app by taking a REAL screenshot of it running in a browser. Run this EXACT command one time:
   node "${PROOF_SCRIPT}" "${WORKSPACE_DIR}" "${PROOF_PATH}"
   This serves your app and saves a screenshot to the proof path.

3. Confirm the file "${PROOF_PATH}" now exists and is non-empty. If it is missing or empty, fix your HTML/JS and run the command again until the screenshot succeeds.

Be fast and decisive. Do not ask questions. Do not create any other files or directories.`;
}
