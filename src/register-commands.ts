import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const command = new SlashCommandBuilder()
  .setName('image')
  .setDescription('使用本機 agy 生圖')
  .addStringOption((option) => option
    .setName('prompt')
    .setDescription('英文或中文圖片描述')
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(800));

const rest = new REST({ version: '10' }).setToken(config.discordToken);

await rest.put(
  Routes.applicationGuildCommands(config.applicationId, config.guildId),
  { body: [command.toJSON()] },
);

console.log('Registered /image for guild', config.guildId);
