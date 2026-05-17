import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, '..');
export const FIXTURES_DIR = join(__dirname, 'fixtures');

/**
 * Create a unique tmp project root. Returns absolute path.
 * Caller must call cleanup(root) when done (use t.after).
 */
export function makeTmpProject(prefix = 'aegis-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanup(root) {
  if (root && existsSync(root)) {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * Write a file inside root, creating parent dirs.
 */
export function writeFile(root, relPath, content) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

/**
 * Read a file inside root and return its text content.
 */
export function readFile(root, relPath) {
  return readFileSync(join(root, relPath), 'utf8');
}

/**
 * Convenience: write JSON.
 */
export function writeJson(root, relPath, obj) {
  return writeFile(root, relPath, JSON.stringify(obj, null, 2));
}

/**
 * Read JSON file.
 */
export function readJson(root, relPath) {
  return JSON.parse(readFile(root, relPath));
}

/**
 * Seed a minimal v2 aegis/ install (config + state) inside root.
 */
export function seedAegisInstall(root, overrides = {}) {
  writeJson(root, 'aegis/config/state.json', {
    output_folder: 'aegis',
    project_name: 'test',
    ...overrides,
  });
  writeFile(root, 'aegis/config/config.toml', '[project]\nname = "test"\n');
  return root;
}

/**
 * Seed a tiny JS project for graph testing.
 */
export function seedJsProject(root) {
  writeFile(root, 'package.json', JSON.stringify({ name: 'demo', type: 'module' }));
  writeFile(root, 'src/a.js', "import { b } from './b.js';\nexport const a = () => b();\n");
  writeFile(root, 'src/b.js', "export const b = () => 42;\n");
  return root;
}

/**
 * Mock inquirer.prompt to return a queue of canned answers. Each call to
 * inquirer.prompt() pops the next answer object. Returns a restore fn.
 *
 * Usage: const restore = mockInquirer([{ proceed: false }]); ... restore();
 */
export async function mockInquirer(answers) {
  const inquirer = await import('inquirer');
  const original = inquirer.default.prompt;
  let i = 0;
  inquirer.default.prompt = async () => {
    const a = answers[i] ?? {};
    i++;
    return a;
  };
  return () => { inquirer.default.prompt = original; };
}

/**
 * Run a command-module's default export with args. Captures stdout/stderr
 * (both console.* and process.stdout/stderr.write) and exit code without
 * exiting the test process.
 */
export async function runCommand(modulePath, args = [], { cwd } = {}) {
  // Use StringDecoder so multi-byte UTF-8 chars (em-dash, accented Portuguese
  // chars) split across chunk boundaries don't become replacement chars.
  const { StringDecoder } = await import('node:string_decoder');
  const outDecoder = new StringDecoder('utf8');
  const errDecoder = new StringDecoder('utf8');
  const stdout = [];
  const stderr = [];
  const origLog = console.log;
  const origErr = console.error;
  const origCwd = process.cwd();
  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  let exitCode = 0;
  const origExit = process.exit;
  process.exit = (code) => { exitCode = code ?? 0; throw new Error(`__test_exit_${exitCode}__`); };
  console.log = (...a) => stdout.push(a.map(String).join(' '));
  console.error = (...a) => stderr.push(a.map(String).join(' '));
  process.stdout.write = (chunk, ...rest) => {
    stdout.push(typeof chunk === 'string' ? chunk : outDecoder.write(chunk));
    return true;
  };
  process.stderr.write = (chunk, ...rest) => {
    stderr.push(typeof chunk === 'string' ? chunk : errDecoder.write(chunk));
    return true;
  };
  if (cwd) process.chdir(cwd);
  try {
    const mod = await import(modulePath);
    await mod.default(args);
  } catch (e) {
    if (!String(e.message).startsWith('__test_exit_')) {
      console.log = origLog;
      console.error = origErr;
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
      process.exit = origExit;
      if (cwd) process.chdir(origCwd);
      throw e;
    }
  } finally {
    stdout.push(outDecoder.end());
    stderr.push(errDecoder.end());
    console.log = origLog;
    console.error = origErr;
    process.stdout.write = origStdoutWrite;
    process.stderr.write = origStderrWrite;
    process.exit = origExit;
    if (cwd) process.chdir(origCwd);
  }
  return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode };
}
