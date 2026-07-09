# Discord X Member Bot

Discord members can register X profile URLs, and the bot keeps an auto-updated member list.

## Commands

- `/register-x url:https://x.com/example`
  - Members register their own X profile.
- `/admin-register-x member:@name url:https://x.com/example`
  - Admins register an X profile for an existing member.
- `/sync-members`
  - Admins import all existing non-bot server members into the list.
- `/members`
  - Shows the current member list privately.
- `/refresh-members`
  - Admins refresh the public member list message.

## Setup

Create `.env` from `.env.example`.

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
GUILD_ID=your_discord_server_id_here
RECORD_CHANNEL_ID=channel_id_for_join_records
MEMBERS_CHANNEL_ID=channel_id_for_member_list
MEMBERS_MESSAGE_ID=
```

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

## Run

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

After the bot is running, use this in Discord:

```text
/sync-members
```

Then use this for members whose X profiles you already know:

```text
/admin-register-x member:@member url:https://x.com/example
```

## Keep It Always Online

Your PC must keep `npm start` running for the bot to stay online. If you want members to register while your PC is closed, run the bot on a hosting service.

Good options:

- Railway
- Render
- Fly.io
- VPS such as Sakura VPS, ConoHa, Xserver VPS, or Lightsail

For the simplest small bot, Railway or Render is usually easiest. Add the same `.env` values to the hosting service, set the start command to `npm start`, and deploy this folder.
