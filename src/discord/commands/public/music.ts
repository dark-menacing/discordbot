import { Command } from "#base";
import { CreateQueueMetadata, icon, res } from "#functions";
import { settings } from "#settings";
import { brBuilder, createEmbed, limitText } from "@magicyan/discord";
import { multimenu } from "@magicyan/discord-ui";
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
        },
        {
            name: "pause",
            description: "Pause the current music.",
            type: ApplicationCommandOptionType.Subcommand,
        }, 
        {
            name: "resume",
            description: "Resume the current music.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "stop",
            description: "Stops the current music.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "skip",
            description: "Skips the current music.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "quantity",
                    description: "Quantity of musics to skip.",
                    type: ApplicationCommandOptionType.Integer,
                    min_value: 1,
                }
            ]
        },
        {
            name: "queue",
            description: "Shows the current queue.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "shuffle",
            description: "Shuffles the current queue.",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "select",
            description: "Selects a music in the queue.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "music",
                    description: "Select a music",
                    type: ApplicationCommandOptionType.String,
                    required, autocomplete: true,
                }
            ]
        },
        {
            name: "search",
            description: "Search for a song.",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "engine",
                    description: "Search engine.",
                    type: ApplicationCommandOptionType.String,
                    choices: Object.values(QueryType).map(type => ({
                        name: type, value: type
                    })),
                    required,
                },
                {
                    name: "search",
                    description: "Name of song or URL.",
                    type: ApplicationCommandOptionType.String,
                    required, autocomplete: true,
                },

            ],
        }
    ],
    async autocomplete(interaction) {
        const {options, guild} = interaction;
        
        const player = useMainPlayer();
        const queue = player.queues.cache.get(guild.id);
        switch(options.getSubcommand(true)) {
            case "search": {
                const searchEngine = options.getString("engine", true);
                const focused = options.getFocused();

                try {
                    const results = await player.search(focused, {
                        searchEngine: searchEngine as SearchQueryType,
                    });
                    if (!results.hasTracks()) return;

                    interaction.respond(results.tracks.map(track => ({
                        name: limitText(`${track.duration} - ${track.title}`, 100),
                        value: track.url,
                    })).slice(0, 25));
                } catch (_) {}
                return;
            }
            case "select": {
                if (!queue || queue.size < 1) return;

                const choices = queue.tracks.map((track, index) => ({
                    name: limitText(`${index} ${track.title}`, 100),
                    value: track.id
                }));
                
                interaction.respond(choices.slice(0,25));
                return;
            }
        }
            

    },
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
                return;
            }
            case "search": {
                const trackUrl = options.getString("search", true);
                const searchEngine = options.getString("engine", true) as SearchQueryType;
                try {
                    const {track } = await player.play(voiceChannel as never, trackUrl, {
                        searchEngine, nodeOptions: { metadata }
                    });

                    const text = queue?.size ? "Added to queue" : "Playing now";
                    interaction.editReply(res.success(`${icon(":a:bell")} ${text} ${track.title}`))
                } catch (_) {
                    interaction.editReply(res.danger(`${icon("close")} Unable to play the music`))
                }
                return;
            }
        }

        if (!queue){
            interaction.editReply(res.danger(`${icon("close")} There isn't an active play queue!`));
            return;
        }

        switch(options.getSubcommand(true)){
            case "pause": {
                if (queue.node.isPaused()){
                    interaction.editReply(res.danger(`${icon("close")} The current song is already paused!`));
                    return;
                }
                queue.node.pause();
                interaction.editReply(res.success(`${icon(":a:bell")} The current song has been paused.`))
                return;
            }
            case "resume": {
                if (!queue.node.isPaused()){
                    interaction.editReply(res.danger(`${icon("close")} The current song is not paused!`));
                    return;
                }
                queue.node.resume();
                interaction.editReply(res.success(`${icon(":a:bell")} The current song has been resumed.`));
                return;
            }
            case "stop": {
                queue.node.stop();
                interaction.editReply(res.success(`${icon(":a:bell")} The current song has been stopped.`));
                return;
            }
            case "skip": {
                const amount = options.getInteger("quantity") ?? 1;
                const minAmount = Math.min(queue.size, amount);
                for (let i = 0; i < minAmount; i++){
                    queue.node.skip();
                }    

                interaction.editReply(res.success(`${icon(":a:bell")} Songs skipped with success.`))
                return;
            }
            case "queue": {
                multimenu({
                    embed: createEmbed({
                        color: settings.colors.fuchsia,
                        description: brBuilder(
                            `# The current queue`,
                            `Songs: ${queue.tracks.size}`,
                            "",
                            `Current song: ${queue.currentTrack?.title ?? "None"}`
                        )
                    }),
                    items: queue.tracks.map(track => ({
                        color: settings.colors.green,
                        description: brBuilder(
                            `**Music**: [${track.title}](${track.url})`,
                            `**Author**: ${track.author}`,
                            `**Duration**: ${track.duration}`,
                        ),
                        thumbnail: track.thumbnail
                    })),
                    render: (embeds, components) => interaction.editReply({ embeds, components })
                });
                return;
            }
            case "shuffle": {
                queue.tracks.shuffle();
                interaction.editReply(res.success(`${icon(":a:bell")} The current song stopped.`));
                return;
            }
            case "select": {
                const trackId = options.getString("music", true);

                try {
                    const skipped = queue.node.skipTo(trackId);
                    interaction.editReply(skipped
                        ? res.success(`${icon(":a:bell")} Songs skipped successfully.`)
                        : res.danger(`${icon("close")} No songs were skipped.`)

                    );
                } catch (error) {
                    interaction.editReply(res.danger("Unable to skip to selected song."));
                }
                return;
            }
        }
    }
});