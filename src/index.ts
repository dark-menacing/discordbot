import { bootstrapApp } from "#base";
import { Player } from "discord-player";
import { YoutubeiExtractor } from "discord-player-youtubei";

await bootstrapApp({ 
    workdir: import.meta.dirname,
    beforeLoad(client) {
        const player = new Player(client as never, {
            useLegacyFFmpeg: false,
            skipFFmpeg: false,
            ytdlOptions: {
                quality: "highestaudio",
            }
        });
        player.extractors.loadDefault();
        player.extractors.register(YoutubeiExtractor, {})
    },
});