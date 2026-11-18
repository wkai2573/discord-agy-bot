import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseSavedFiles } from '../src/agy.js';

describe('parseSavedFiles', () => {
  it('extracts SAVED lines and removes duplicates', () => {
    const outDir = path.resolve('tmp-output');
    const savedFile = path.join(outDir, 'image.jpg');
    const output = `SAVED: ${savedFile}\nSAVED: ${savedFile}`;
    expect(parseSavedFiles(output, outDir)).toEqual([savedFile]);
  });

  it('returns no files when output has no saved result', () => {
    expect(parseSavedFiles('NO_IMAGE_GENERATED', 'tmp-output')).toEqual([]);
  });
});
