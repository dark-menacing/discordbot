# discordbot
My Discord bot.

This is a Discord bot I created in TS. I created it as a side project, so I recommend that you don't use it for real production

## Self host
You can self host this bot with Docker by running:
```bash
docker run --tty=true \
    --interactive=true \
    --detach=true \
    --restart unless-stopped \
    --env "BOT_TOKEN="[your discord bot token]" CLIENT_ID="[your bot client id]"" \
    evertoncandido/discordts-bot
```

Don't forget to include the discord bot token and client id! And that's basically it.