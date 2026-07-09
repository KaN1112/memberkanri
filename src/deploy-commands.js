require("dotenv").config();

const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("register-x")
    .setDescription("Register your own X profile URL")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("https://x.com/your_name or https://twitter.com/your_name")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("admin-register-x")
    .setDescription("Admin: register an X profile URL for an existing member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("Member to register")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("https://x.com/your_name or https://twitter.com/your_name")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("sync-members")
    .setDescription("Admin: import existing server members into the list")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("members")
    .setDescription("Show the current member list"),
  new SlashCommandBuilder()
    .setName("refresh-members")
    .setDescription("Admin: refresh the member list message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((command) => command.toJSON());

async function main() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    throw new Error("Set DISCORD_TOKEN, CLIENT_ID, and GUILD_ID in .env.");
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("Slash commands deployed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
