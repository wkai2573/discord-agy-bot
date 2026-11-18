import { describe, expect, it } from 'vitest';
import { JobQueue } from '../src/queue.js';

describe('JobQueue', () => {
  it('limits concurrent jobs', async () => {
    const queue = new JobQueue(1);
    let active = 0;
    let maxActive = 0;

    await Promise.all([1, 2, 3].map(() => queue.run(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active--;
    })));

    expect(maxActive).toBe(1);
  });

  it('rejects invalid limits', () => {
    expect(() => new JobQueue(0)).toThrow('positive integer');
  });
});
