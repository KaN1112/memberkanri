require("dotenv").config();

const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Botはオンラインです");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Webサーバーを起動しました: ${PORT}`);
});

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
    throw new Error(`${name} を .env に設定してください。`);
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
    .setTitle("新しいメンバーが参加しました")
    .setColor(0x31a66a)
    .addFields(
      { name: "メンバー", value: `${member} / ${member.displayName}`, inline: false },
      { name: "Discord ID", value: member.id, inline: true },
      { name: "X", value: "未登録", inline: true }
    )
    .setTimestamp(new Date());
}

function buildXRegisteredEmbed(saved, registeredBy) {
  return new EmbedBuilder()
    .setTitle("Xアカウントが登録されました")
    .setColor(0x2f80ed)
    .addFields(
      { name: "メンバー", value: `${saved.mention} / ${saved.displayName}`, inline: false },
      { name: "X", value: saved.xUrl, inline: false },
      { name: "登録者", value: registeredBy, inline: false }
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
  console.log(`${client.user.tag} としてログインしました`);
  await updateMemberList(client);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    upsertMember(member);
    await postRecord(buildJoinEmbed(member));
    await updateMemberList(client);
  } catch (error) {
    console.error("新規メンバーの処理に失敗しました。", error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "register-x") {
    const url = normalizeXUrl(interaction.options.getString("url", true));

    if (!url) {
      await interaction.reply({
        content: "Xリンクは `https://x.com/ユーザー名` の形式で入力してください。",
        ephemeral: true
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    await registerXForMember(member, url, `${interaction.user}`);
    await interaction.reply({
      content: "Xアカウントを登録しました。メンバー一覧も更新しました。",
      ephemeral: true
    });
  }

  if (interaction.commandName === "admin-register-x") {
    const url = normalizeXUrl(interaction.options.getString("url", true));

    if (!url) {
      await interaction.reply({
        content: "Xリンクは `https://x.com/ユーザー名` の形式で入力してください。",
        ephemeral: true
      });
      return;
    }

    const user = interaction.options.getUser("member", true);
    const member = await interaction.guild.members.fetch(user.id);
    await registerXForMember(member, url, `${interaction.user}`);
    await interaction.reply({
      content: `${member} のXアカウントを登録しました。メンバー一覧も更新しました。`,
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
    await interaction.editReply(`既存メンバー ${imported} 人を取り込み、メンバー一覧を更新しました。`);
  }

  if (interaction.commandName === "members") {
    await interaction.reply({ embeds: [buildMemberListEmbed()], ephemeral: true });
  }

  if (interaction.commandName === "refresh-members") {
    await updateMemberList(client);
    await interaction.reply({ content: "メンバー一覧を更新しました。", ephemeral: true });
  }
});

requireEnv("DISCORD_TOKEN");
client.login(process.env.DISCORD_TOKEN);
