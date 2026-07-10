# Discord X Member Bot

Discord members can register X profile URLs, and the bot keeps an auto-updated member list for each server.

## Multi-Server Setup

For multiple Discord servers, leave this empty in `.env`:

```env
GUILD_ID=
```

Then register global slash commands:

```bash
npm run deploy-commands
```

Invite the same bot to each server. In each server, an admin must run:

```text
/setup-channels record_channel:#参加記録 members_channel:#メンバー一覧
```

After that, each server keeps its own:

- record channel
- member list channel
- member list message
- registered X profiles

## Commands

- `/setup-channels record_channel:#参加記録 members_channel:#メンバー一覧`
  - Admins set channels for the current server.
- `/register-x url:https://x.com/example`
  - Members register their own X profile.
- `/admin-register-x member:@name url:https://x.com/example`
  - Admins register an X profile for an existing member.
- `/sync-members`
  - Admins import all existing non-bot server members into the list.
- `/members`
  - Shows the current server's member list privately.
- `/refresh-members`
  - Admins refresh the current server's public member list message.

## Required Discord Setting

Enable this in Discord Developer Portal:

- Bot > Privileged Gateway Intents > SERVER MEMBERS INTENT

Invite the bot with these scopes:

- `bot`
- `applications.commands`

Recommended permissions:

- View Channels
- Send Messages
- Embed Links
- Read Message History

## Run Locally

```bash
npm install
npm run deploy-commands
npm start
```

After changing slash commands, run this again:

```bash
npm run deploy-commands
```

## Import Existing Members

After `/setup-channels`, use this in each Discord server:

```text
/sync-members
```

Then use this for members whose X profiles you already know:

```text
/admin-register-x member:@member url:https://x.com/example
```

## Notes

- Do not upload `.env` to GitHub.
- Global slash commands can take some time to appear in every server.
- If you set `GUILD_ID`, commands are registered only to that one server. For multi-server use, leave it empty.
