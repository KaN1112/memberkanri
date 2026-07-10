const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "members.json");

function emptyStore() {
  return { guilds: {} };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyStore(), null, 2));
  }
}

function migrateStore(store) {
  if (store.guilds) return store;

  const guildId = process.env.GUILD_ID || "default";
  return {
    guilds: {
      [guildId]: {
        recordChannelId: process.env.RECORD_CHANNEL_ID || null,
        membersChannelId: process.env.MEMBERS_CHANNEL_ID || null,
        listMessageId: process.env.MEMBERS_MESSAGE_ID || store.listMessageId || null,
        members: store.members || {}
      }
    }
  };
}

function readStore() {
  ensureStore();
  const store = migrateStore(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  writeStore(store);
  return store;
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function getGuildStore(store, guildId) {
  if (!store.guilds[guildId]) {
    store.guilds[guildId] = {
      recordChannelId: null,
      membersChannelId: null,
      listMessageId: null,
      members: {}
    };
  }

  return store.guilds[guildId];
}

function configureGuild(guildId, config) {
  const store = readStore();
  const guild = getGuildStore(store, guildId);

  guild.recordChannelId = config.recordChannelId;
  guild.membersChannelId = config.membersChannelId;

  if (config.resetListMessage) {
    guild.listMessageId = null;
  }

  writeStore(store);
  return guild;
}

function getGuildConfig(guildId) {
  const store = readStore();
  const guild = getGuildStore(store, guildId);

  if (!guild.recordChannelId && guildId === process.env.GUILD_ID) {
    guild.recordChannelId = process.env.RECORD_CHANNEL_ID || null;
  }

  if (!guild.membersChannelId && guildId === process.env.GUILD_ID) {
    guild.membersChannelId = process.env.MEMBERS_CHANNEL_ID || null;
  }

  if (!guild.listMessageId && guildId === process.env.GUILD_ID) {
    guild.listMessageId = process.env.MEMBERS_MESSAGE_ID || null;
  }

  return guild;
}

function upsertMember(member, changes = {}) {
  const store = readStore();
  const guild = getGuildStore(store, member.guild.id);
  const existing = guild.members[member.id] || {};

  guild.members[member.id] = {
    ...existing,
    id: member.id,
    username: member.user.username,
    displayName: member.displayName,
    mention: `<@${member.id}>`,
    joinedAt: member.joinedAt ? member.joinedAt.toISOString() : existing.joinedAt || null,
    xUrl: existing.xUrl || null,
    updatedAt: new Date().toISOString(),
    ...changes
  };

  writeStore(store);
  return guild.members[member.id];
}

function setListMessageId(guildId, messageId) {
  const store = readStore();
  const guild = getGuildStore(store, guildId);
  guild.listMessageId = messageId;
  writeStore(store);
}

function getListMessageId(guildId) {
  return getGuildConfig(guildId).listMessageId;
}

function getMembers(guildId) {
  const guild = getGuildConfig(guildId);
  return Object.values(guild.members).sort((a, b) => {
    const dateA = a.joinedAt || "";
    const dateB = b.joinedAt || "";
    return dateA.localeCompare(dateB);
  });
}

function getConfiguredGuildIds() {
  const store = readStore();
  return Object.entries(store.guilds)
    .filter(([, guild]) => guild.membersChannelId)
    .map(([guildId]) => guildId);
}

module.exports = {
  configureGuild,
  getConfiguredGuildIds,
  getGuildConfig,
  getListMessageId,
  getMembers,
  setListMessageId,
  upsertMember
};
