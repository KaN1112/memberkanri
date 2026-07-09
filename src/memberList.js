const { EmbedBuilder } = require("discord.js");
const { getListMessageId, getMembers, setListMessageId } = require("./storage");

const MAX_FIELD_LENGTH = 1024;

function formatDate(value) {
  if (!value) return "不明";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}

function buildMemberLines() {
  const members = getMembers();

  if (members.length === 0) {
    return ["まだ登録メンバーはいません。"];
  }

  return members.map((member, index) => {
    const x = member.xUrl ? member.xUrl : "未登録";
    return `${index + 1}. ${member.mention} / ${member.displayName}\nX: ${x}\n参加: ${formatDate(member.joinedAt)}`;
  });
}

function chunkLines(lines) {
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n\n${line}` : line;
    if (next.length > MAX_FIELD_LENGTH) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function buildMemberListEmbed() {
  const members = getMembers();
  const chunks = chunkLines(buildMemberLines());
  const embed = new EmbedBuilder()
    .setTitle("メンバー一覧")
    .setDescription(`登録人数: ${members.length}人`)
    .setColor(0x2f80ed)
    .setTimestamp(new Date());

  chunks.slice(0, 25).forEach((chunk, index) => {
    embed.addFields({
      name: index === 0 ? "一覧" : `一覧 ${index + 1}`,
      value: chunk
    });
  });

  if (chunks.length > 25) {
    embed.setFooter({ text: "表示上限を超えています。必要なら保存形式をDB/スプレッドシートに拡張してください。" });
  }

  return embed;
}

async function updateMemberList(client) {
  const channelId = process.env.MEMBERS_CHANNEL_ID;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) return;

  const embed = buildMemberListEmbed();
  const messageId = getListMessageId();

  if (messageId) {
    try {
      const message = await channel.messages.fetch(messageId);
      await message.edit({ embeds: [embed] });
      return;
    } catch (error) {
      console.warn("Existing member list message could not be updated. Creating a new one.", error.message);
    }
  }

  const message = await channel.send({ embeds: [embed] });
  setListMessageId(message.id);
}

module.exports = {
  buildMemberListEmbed,
  updateMemberList
};
