require("dotenv").config();

const {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits
} = require("discord.js");
const { buildMemberListEmbed, updateMemberList } = require("./memberList");
const { upsertMember } = require("./storage");

const X_URL_PATTERN = /^https?:\/\/(x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}\/?$/i;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Set ${name} in .env.`);
  }
}

function normalizeXUrl(input) {
  const trimmed = input.trim();
  if (!X_URL_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/twitter\.com/i, "https://x.com")
    .replace(/\/$/, "");
}

function buildJoinEmbed(member) {
  return new EmbedBuilder()
    .setTitle("New member joined")
    .setColor(0x31a66a)
    .addFields(
      { name: "Member", value: `${member} / ${member.displayName}`, inline: false },
      { name: "Discord ID", value: member.id, inline: true },
      { name: "X", value: "Not registered", inline: true }
    )
    .setTimestamp(new Date());
}

function buildXRegisteredEmbed(saved, registeredBy) {
  return new EmbedBuilder()
    .setTitle("X profile registered")
    .setColor(0x2f80ed)
    .addFields(
      { name: "Member", value: `${saved.mention} / ${saved.displayName}`, inline: false },
      { name: "X", value: saved.xUrl, inline: false },
      { name: "Registered by", value: registeredBy, inline: false }
    )
    .setTimestamp(new Date());
}

async function postRecord(embed) {
  const channelId = process.env.RECORD_CHANNEL_ID;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  if (channel && channel.isTextBased()) {
    await channel.send({ embeds: [embed] });
  }
}

async function registerXForMember(member, url, registeredBy) {
  const saved = upsertMember(member, { xUrl: url });
  await postRecord(buildXRegisteredEmbed(saved, registeredBy));
  await updateMemberList(client);
  return saved;
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateMemberList(client);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    upsertMember(member);
    await postRecord(buildJoinEmbed(member));
    await updateMemberList(client);
  } catch (error) {
    console.error("Failed to process new member.", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "register-x") {
    const url = normalizeXUrl(interaction.options.getString("url", true));

    if (!url) {
      await interaction.reply({
        content: "Enter an X URL like `https://x.com/your_name`.",
        ephemeral: true
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    await registerXForMember(member, url, `${interaction.user}`);
    await interaction.reply({ content: "Your X profile was registered and the member list was updated.", ephemeral: true });
  }

  if (interaction.commandName === "admin-register-x") {
    const url = normalizeXUrl(interaction.options.getString("url", true));

    if (!url) {
      await interaction.reply({
        content: "Enter an X URL like `https://x.com/your_name`.",
        ephemeral: true
      });
      return;
    }

    const user = interaction.options.getUser("member", true);
    const member = await interaction.guild.members.fetch(user.id);
    await registerXForMember(member, url, `${interaction.user}`);
    await interaction.reply({
      content: `Registered ${member}'s X profile and updated the member list.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "sync-members") {
    await interaction.deferReply({ ephemeral: true });
    const members = await interaction.guild.members.fetch();
    let imported = 0;

    for (const member of members.values()) {
      if (member.user.bot) continue;
      upsertMember(member);
      imported += 1;
    }

    await updateMemberList(client);
    await interaction.editReply(`Imported ${imported} existing members and updated the member list.`);
  }

  if (interaction.commandName === "members") {
    await interaction.reply({ embeds: [buildMemberListEmbed()], ephemeral: true });
  }

  if (interaction.commandName === "refresh-members") {
    await updateMemberList(client);
    await interaction.reply({ content: "Member list refreshed.", ephemeral: true });
  }
});

requireEnv("DISCORD_TOKEN");
client.login(process.env.DISCORD_TOKEN);
