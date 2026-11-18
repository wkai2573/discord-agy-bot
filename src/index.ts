import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AttachmentBuilder, ChatInputCommandInteraction, Client, Events, GatewayIntentBits } from 'discord.js';
import { generateImage } from './agy.js';
import { loadConfig } from './config.js';
import { JobQueue } from './queue.js';

const config = loadConfig();
const queue = new JobQueue(config.maxConcurrentJobs);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

function safeName(interaction: ChatInputCommandInteraction): string {
  return `discord-${interaction.user.id}-${Date.now()}`;
}

async function handleImage(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.channelId !== config.imageChannelId) {
    await interaction.reply({
      content: `此指令只能在指定頻道使用：<#${config.imageChannelId}>`,
      ephemeral: true,
    });
    return;
  }

  const prompt = interaction.options.getString('prompt', true).trim();
  if (prompt.length < 3) {
    await interaction.reply({ content: 'Prompt 至少需要 3 個字元。', ephemeral: true });
    return;
  }

  await interaction.deferReply();
  await queue.run(async () => {
    const requestDir = await fs.mkdtemp(path.join(os.tmpdir(), 'discord-agy-'));
    try {
      const result = await generateImage({
        prompt,
        outDir: requestDir,
        name: safeName(interaction),
        scriptPath: config.agyScriptPath,
        timeoutSeconds: config.agyTimeoutSeconds,
      });

      const attachments = result.files.map((file, index) =>
        new AttachmentBuilder(file, { name: `generated-${index + 1}${path.extname(file)}` }),
      );

      await interaction.editReply({
        content: `由 <@${interaction.user.id}> 送出的生圖完成：`,
        files: attachments,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await interaction.editReply(`生圖失敗：${message.slice(0, 1800)}`);
    } finally {
      await fs.rm(requestDir, { recursive: true, force: true }).catch(() => undefined);
    }
  });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'image') return;

  try {
    await handleImage(interaction);
  } catch (error) {
    console.error('Unhandled interaction error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Bot 發生未預期錯誤。', ephemeral: true }).catch(() => undefined);
    } else {
      await interaction.editReply('Bot 發生未預期錯誤。').catch(() => undefined);
    }
  }
});

client.login(config.discordToken);
