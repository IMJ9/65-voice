# Silent Discord Voice Bot

A bot that joins one configured Discord voice channel muted and deafened.

## Environment variables
- `BOT_TOKEN`: your bot token (keep it secret)
- `CHANNEL_ID`: the voice channel ID

## Run
```bash
npm install
npm start
```

Deploy as a Render Background Worker. The bot needs View Channel and Connect permissions in the target voice channel.
