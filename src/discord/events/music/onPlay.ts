import { getQueueMetadata, setSongStatus } from "#functions";
import { settings } from "#settings";
import { brBuilder, createEmbed } from "@magicyan/discord";
import { useMainPlayer } from "discord-player";

const player = useMainPlayer();

player.events.on("playerStart", (queue, track) => {
    const { client, channel, voiceChannel } = getQueueMetadata(queue);

    setSongStatus(client, track);

    const embed = createEmbed({
        color: settings.colors.fuchsia,
        title: "🎵 Playing now",
        thumbnail: track.thumbnail,
        url: track.url,
        description: brBuilder(
            `**Music**: ${track.title}`,
            `**Author**: ${track.author}`,
            `**Voice Channel**: ${voiceChannel}`,
            `**Duration**: ${track.duration}`
        )
    })

    channel.send({ embeds: [embed] })
})