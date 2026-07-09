const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "members.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ members: {}, listMessageId: null }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function upsertMember(member, changes = {}) {
  const store = readStore();
  const existing = store.members[member.id] || {};

  store.members[member.id] = {
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
  return store.members[member.id];
}

function setListMessageId(messageId) {
  const store = readStore();
  store.listMessageId = messageId;
  writeStore(store);
}

function getListMessageId() {
  const store = readStore();
  return process.env.MEMBERS_MESSAGE_ID || store.listMessageId;
}

function getMembers() {
  const store = readStore();
  return Object.values(store.members).sort((a, b) => {
    const dateA = a.joinedAt || "";
    const dateB = b.joinedAt || "";
    return dateA.localeCompare(dateB);
  });
}

module.exports = {
  getListMessageId,
  getMembers,
  setListMessageId,
  upsertMember
};
