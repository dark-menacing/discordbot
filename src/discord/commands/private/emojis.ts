import { Command } from "#base";
import { ApplicationCommandType, AttachmentBuilder } from "discord.js";

new Command({
    name: "emojis",
    description: "Retorna uma lista JSON de emojis.",
    type: ApplicationCommandType.ChatInput,
    async run(interaction){
        const { guild } = interaction;

        interface Emojis {
            static: Record<string, string>;
            animated: Record<string, string>;
        }

        const emoji: Emojis = {static: {}, animated: {}};

        const emojisCache = guild.emojis.cache

        for (const { name, id, animated } of emojisCache.values()){
            if (!name) continue;
            emoji[animated ? "animated":"static"][name] = id
        }

        const buffer = Buffer.from(JSON.stringify(emoji, null, 2), "utf-8");
        const attachment = new AttachmentBuilder(buffer, {name: "emojis.json"})

        interaction.reply({
            ephemeral, files: [attachment],
            content: `Emojis do Server`
        })
    }
});