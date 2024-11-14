import { Command } from "#base";
import { CreateQueueMetadata, icon, res } from "#functions";
import { brBuilder } from "@magicyan/discord";
import { QueryType, SearchQueryType, useMainPlayer } from "discord-player";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";

new Command({
    name: "music",
    description: "Music command.",
    dmPermission: false,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "play",
            description: "Play a song.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "search",
                    description: "Name of song or URL.",
                    type: ApplicationCommandOptionType.String,
                    required
                },
                {
                    name: "engine",
                    description: "Search engine.",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    choices: Object.values(QueryType).map(type => ({
                        name: type, value: type
                    }))
                },
            ],
        }
    ],
    async run(interaction){
        const {options, member, guild, channel, client} = interaction;
        
        const voiceChannel = member.voice.channel;
        if (!voiceChannel){
            interaction.reply(res.danger(`You need to be in a voice channel to use this command!`));
            return;
        }
        if (!channel){
            interaction.reply(res.danger(`You cannot use this command in this channel!`));
            return;
        }

        const metadata = CreateQueueMetadata({ channel, client, guild, voiceChannel})
        const player = useMainPlayer();
        const queue = player.queues.cache.get(guild.id);

        await interaction.deferReply({ ephemeral});
        switch(options.getSubcommand(true)){
            case "play": {
                const query = options.getString("search", true );
                const SearchEngine = options.getString("engine") ?? QueryType.YOUTUBE;

                try {
                    const { track, searchResult } = await player.play(voiceChannel as never, query, {
                        searchEngine: SearchEngine as SearchQueryType,
                        nodeOptions: { metadata }
                    })

                    const display: string[] = [];
                    
                    if (searchResult.playlist) {
                        const {tracks, title, url} = searchResult.playlist;
                        display.push(
                            `${icon(":a:bell")} Added ${tracks.length} of playlist ${title}[${url}]`,
                            ...tracks.map(track => `${track.title}`).slice(0, 8),
                            "..."
                        );
                    } else {
                        display.push(`${icon(":a:bell")} ${queue?.size ? "Added to queue": "Playing Now"} ${track.title}`);
                    }
                    interaction.editReply(res.success(brBuilder(display)));
                } catch (error) {
                    interaction.editReply(res.danger(`${icon("close")} Unable to play music.`))
                }
            }
        }
    }
});