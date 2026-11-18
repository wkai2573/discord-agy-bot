import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const baseEnv = {
  DISCORD_TOKEN: 'token',
  DISCORD_APPLICATION_ID: 'app',
  DISCORD_GUILD_ID: 'guild',
  DISCORD_IMAGE_CHANNEL_ID: 'channel',
};

describe('loadConfig', () => {
  it('loads required Discord settings', () => {
    const config = loadConfig({ ...baseEnv, AGY_TIMEOUT_SECONDS: '120' });
    expect(config.discordToken).toBe('token');
    expect(config.agyTimeoutSeconds).toBe(120);
  });

  it('rejects missing settings', () => {
    expect(() => loadConfig({})).toThrow('DISCORD_TOKEN');
  });

  it('rejects invalid positive integers', () => {
    expect(() => loadConfig({ ...baseEnv, MAX_CONCURRENT_IMAGE_JOBS: '0' }))
      .toThrow('MAX_CONCURRENT_IMAGE_JOBS');
  });
});
