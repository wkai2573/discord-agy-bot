import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface AgyResult {
  files: string[];
  output: string;
}

export function parseSavedFiles(output: string, outDir: string): string[] {
  const files: string[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /^SAVED:\s*(.+)$/i.exec(line.trim());
    if (!match) continue;
    const absolute = path.isAbsolute(match[1]) ? match[1] : path.resolve(outDir, match[1]);
    if (!files.includes(absolute)) files.push(absolute);
  }
  return files;
}

export async function generateImage(options: {
  prompt: string;
  outDir: string;
  name: string;
  scriptPath: string;
  timeoutSeconds: number;
}): Promise<{ files: string[]; output: string }> {
  await fs.mkdir(options.outDir, { recursive: true });

  const args = [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', options.scriptPath,
    '-Prompt', options.prompt,
    '-OutDir', options.outDir,
    '-Name', options.name,
    '-TimeoutSec', String(options.timeoutSeconds),
  ];

  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn('pwsh.exe', args, {
      cwd: process.cwd(),
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
      if (code === 0) resolve(combined);
      else reject(new Error(`agy generation failed (exit ${code ?? 'unknown'}): ${combined || 'no output'}`));
    });
  });

  const files = parseSavedFiles(output, options.outDir);
  const existing: string[] = [];
  for (const file of files) {
    try {
      await fs.access(file);
      existing.push(file);
    } catch {
      // Ignore paths that no longer exist.
    }
  }

  if (existing.length === 0) {
    throw new Error(output.includes('NO_IMAGE_GENERATED')
      ? 'agy did not generate an image'
      : 'agy completed without reporting a saved image');
  }

  return { files: existing, output };
}
