import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, mkdtempSync, rmSync } from 'fs';
import { join, resolve, relative, isAbsolute } from 'path';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { readJsonSafe } from '../utils/json-safe.js';

const MAX_DIAGRAMS = 200;
const MMDC_TIMEOUT_MS = 30_000;
const SHELL_META = /[;&|`$<>()\\\n\r]/;

export default async function exportDiagrams(args) {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'svg';
  const customOutput = args.find(a => a.startsWith('--output='))?.split('=')[1];
  const noRender = args.includes('--no-render');

  if (!['svg', 'png'].includes(format)) {
    console.error(chalk.red(`\n  Invalid format: "${format}". Use --format=svg or --format=png\n`));
    process.exit(1);
  }

  const projectRoot = process.cwd();

  let resolvedCustomOutput = null;
  if (customOutput !== undefined) {
    const validation = validateCustomOutput(customOutput, projectRoot);
    if (!validation.ok) {
      console.error(chalk.red(`\n  Invalid --output: ${validation.reason}\n`));
      process.exit(1);
    }
    resolvedCustomOutput = validation.path;
  }

  const mmdc = noRender ? null : findMmdc();
  if (!noRender && !mmdc) {
    console.log(chalk.yellow('\n  @mermaid-js/mermaid-cli not found.'));
    console.log('  Install with: ' + chalk.bold('npm install -g @mermaid-js/mermaid-cli'));
    console.log('  Or run with ' + chalk.bold('--no-render') + ' to extract .mmd files only.\n');
    process.exit(1);
  }

  const statePath = join(projectRoot, 'aegis', 'config', 'state.json');
  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  Aegis Spec is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx aegis-spec install') + ' to install.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const outputFolder = state.output_folder || 'aegis';
  const sddPath = join(projectRoot, outputFolder);

  if (!existsSync(sddPath)) {
    console.log(chalk.yellow(`\n  Output folder not found: ${outputFolder}`));
    console.log('  Run the agents first to generate the artifacts.\n');
    return;
  }

  const diagramsDir = resolvedCustomOutput ?? join(sddPath, 'diagrams');
  mkdirSync(diagramsDir, { recursive: true });

  const spinner = ora(`Looking for diagrams in ${outputFolder}...`).start();
  const mdFiles = findMdFiles(sddPath);
  const blocks = [];

  for (const file of mdFiles) {
    if (blocks.length >= MAX_DIAGRAMS) break;
    const content = readFileSync(file, 'utf8');
    const found = extractMermaidBlocks(content);
    if (found.length > 0) {
      const rel = file.replace(sddPath, '').replace(/\\/g, '/').replace(/^\//, '');
      for (let i = 0; i < found.length && blocks.length < MAX_DIAGRAMS; i++) {
        blocks.push({ diagram: found[i], source: rel, index: i });
      }
    }
  }

  if (blocks.length === 0) {
    spinner.warn('No Mermaid diagrams found. Run the agents first.');
    console.log();
    return;
  }

  spinner.succeed(`${blocks.length} diagram(s) found${blocks.length === MAX_DIAGRAMS ? ` (capped at ${MAX_DIAGRAMS})` : ''}.`);
  console.log();

  // Single isolated tmp dir per invocation, avoids predictable filenames and
  // concurrent-process collisions. Mode 0700 by default on POSIX.
  const tmpRoot = mkdtempSync(join(tmpdir(), 'aegis-export-'));

  let success = 0;
  let failed = 0;

  try {
    for (const { diagram, source, index } of blocks) {
      const baseName = source
        .replace(/\.md$/, '')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '_');
      const countForSource = blocks.filter(b => b.source === source).length;
      const suffix = countForSource > 1 ? `-${index + 1}` : '';
      const outName = `${baseName}${suffix}.${format}`;
      const outPath = join(diagramsDir, outName);
      const tmpFile = join(tmpRoot, `${baseName}${suffix}-${index}.mmd`);

      writeFileSync(tmpFile, diagram, 'utf8');

      if (noRender) {
        // Driver D: extract only. Copy .mmd into diagrams dir, skip mmdc.
        const mmdOut = join(diagramsDir, `${baseName}${suffix}.mmd`);
        writeFileSync(mmdOut, diagram, 'utf8');
        console.log(chalk.hex('#ffa203')(`  ✓ ${baseName}${suffix}.mmd (extracted, not rendered)`));
        success++;
        continue;
      }

      const spin = ora(`  Exporting ${outName}...`).start();
      try {
        execFileSync(mmdc, ['-i', tmpFile, '-o', outPath], {
          stdio: 'pipe',
          shell: false,
          cwd: tmpRoot,
          timeout: MMDC_TIMEOUT_MS,
          windowsHide: true,
        });
        spin.succeed(chalk.hex('#ffa203')(`  ✓ ${outName}`));
        success++;
      } catch (err) {
        const stderr = err.stderr?.toString() ?? err.message ?? '';
        const safeMsg = stripControlChars(stderr.split('\n')[0]).slice(0, 200);
        spin.fail(chalk.red(`  ✗ ${outName} — ${safeMsg}`));
        failed++;
      }
    }
  } finally {
    try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  console.log();
  console.log(chalk.bold(noRender ? '  Extraction complete:' : '  Export complete:'));
  console.log(`  ${chalk.hex('#ffa203')(success + (noRender ? ' extracted' : ' exported'))}${failed > 0 ? '  ' + chalk.red(failed + ' error(s)') : ''}`);
  console.log(`  Folder: ${chalk.cyan(diagramsDir)}\n`);
}

// Validates a user-provided --output path. Rejects shell metacharacters,
// resolves against projectRoot, and ensures the result stays inside it.
function validateCustomOutput(value, projectRoot) {
  if (typeof value !== 'string' || value.length === 0) {
    return { ok: false, reason: 'empty value' };
  }
  if (SHELL_META.test(value)) {
    return { ok: false, reason: 'contains shell metacharacters' };
  }
  const resolved = resolve(projectRoot, value);
  const rel = relative(projectRoot, resolved);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { ok: false, reason: 'path escapes project root' };
  }
  return { ok: true, path: resolved };
}

// Looks up the mmdc binary. Returns the raw path (no quoting) since we now
// invoke via execFile with an argv array — no shell parsing involved.
function findMmdc() {
  try {
    execFileSync('mmdc', ['--version'], { stdio: 'pipe', shell: false, timeout: 5_000, windowsHide: true });
    return 'mmdc';
  } catch { /* fall through */ }

  const local = join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  if (existsSync(local)) return local;

  return null;
}

function findMdFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findMdFiles(full));
    } else if (entry.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

function extractMermaidBlocks(content) {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

// Strips ANSI escapes and ASCII control chars from text headed for stdout,
// avoiding terminal hijacking via attacker-controlled stderr from mmdc.
function stripControlChars(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/[\x00-\x1f\x7f]/g, '');
}
