# Render Deploy Guide

Use a Render Background Worker for this bot. A Web Service can sleep when idle, but a Background Worker is meant for a continuously running process that does not receive HTTP traffic.

## 1. Push this folder to GitHub

Render deploys from a Git repository. Put the contents of this folder in a GitHub repository:

```text
discord-x-member-bot/
```

Do not commit `.env`.

## 2. Create the Render service

Recommended path:

1. Open Render Dashboard.
2. New > Blueprint.
3. Connect the GitHub repository.
4. Render should detect `render.yaml`.
5. Create the service.

The included `render.yaml` creates:

- Background Worker
- Node runtime
- Start command: `npm start`
- Persistent disk mounted at `/var/data`

## 3. Add environment variables

Render will ask for these because `render.yaml` marks them as secret/manual values:

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
RECORD_CHANNEL_ID=
MEMBERS_CHANNEL_ID=
MEMBERS_MESSAGE_ID=
```

Use the same values from your local `.env`.

`MEMBERS_MESSAGE_ID` can be left blank unless you already have a specific list message to update.

## 4. Deploy slash commands

Render runs the bot with `npm start`, but slash command deployment is a separate one-time step.

Run this locally after changing commands:

```bash
npm run deploy-commands
```

Then redeploy or restart the Render worker.

## 5. Confirm it is online

In Render logs, look for:

```text
Logged in as ...
```

Then test in Discord:

```text
/sync-members
/admin-register-x member:@name url:https://x.com/example
```

## Important Notes

- A Render Free Web Service is not a good fit for this bot because it can spin down after idle time.
- Background Workers do not have a Free instance type on Render.
- The persistent disk is important. Without it, the local member data file can be lost on restart or redeploy.
