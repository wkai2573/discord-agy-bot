import 'dotenv/config';
import os from 'node:os';
import path from 'node:path';

export interface AppConfig {
  discordToken: string;
  applicationId: string;
  guildId: string;
  imageChannelId: string;
  agyScriptPath: string;
  agyTimeoutSeconds: number;
  maxConcurrentJobs: number;
}

function required(name: string, env: NodeJS.ProcessEnv): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveInteger(name: string, fallback: number, env: NodeJS.ProcessEnv): number {
  const raw = env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const get = (name: string) => required(name, env);
  const defaultScript = path.join(
    os.homedir(),
    '.claude',
    'skills',
    'generate-image',
    'scripts',
    'generate-image.ps1',
  );

  return {
    discordToken: get('DISCORD_TOKEN'),
    applicationId: get('DISCORD_APPLICATION_ID'),
    guildId: get('DISCORD_GUILD_ID'),
    imageChannelId: get('DISCORD_IMAGE_CHANNEL_ID'),
    agyScriptPath: env.AGY_SCRIPT_PATH?.trim() || defaultScript,
    agyTimeoutSeconds: positiveInteger('AGY_TIMEOUT_SECONDS', 300, env),
    maxConcurrentJobs: positiveInteger('MAX_CONCURRENT_IMAGE_JOBS', 1, env),
  };
}
