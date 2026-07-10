require("dotenv").config();

const {
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("setup-channels")
    .setDescription("管理者用: このサーバーの記録先と一覧先を設定します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("record_channel")
        .setDescription("参加記録とX登録ログを投稿するチャンネル")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("members_channel")
        .setDescription("メンバー一覧を表示するチャンネル")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("register-x")
    .setDescription("自分のXアカウントを登録します")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("https://x.com/your_name または https://twitter.com/your_name")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("admin-register-x")
    .setDescription("管理者用: 既存メンバーのXアカウントを登録します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("登録するメンバー")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("https://x.com/your_name または https://twitter.com/your_name")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("sync-members")
    .setDescription("管理者用: 既存メンバーを一覧に取り込みます")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("members")
    .setDescription("現在のメンバー一覧を表示します"),
  new SlashCommandBuilder()
    .setName("refresh-members")
    .setDescription("管理者用: メンバー一覧メッセージを更新します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((command) => command.toJSON());

async function main() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

  if (!DISCORD_TOKEN || !CLIENT_ID) {
    throw new Error("DISCORD_TOKEN と CLIENT_ID を .env に設定してください。");
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("指定サーバー用のスラッシュコマンドを登録しました。");
    console.log("複数サーバーで使う場合は、.env の GUILD_ID を空にして再実行するとグローバル登録になります。");
    return;
  }

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log("全サーバー用のスラッシュコマンドを登録しました。");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
