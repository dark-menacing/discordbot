import chalk from 'chalk';
import { ChatInputCommandInteraction, Client, Collection, GatewayIntentBits, MessageFlags, REST, Routes, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a as keyof typeof GatewayIntentBits];
    })
});

const commands = new Collection<string, { data: SlashCommandBuilder, run: Function }>();

commands.set('ping', {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong! Returns ping (or latency)'),
    async run(interaction: ChatInputCommandInteraction) {
        await interaction.reply(`Pong! Your current ping is ${Date.now() - interaction.createdTimestamp}.`)
    }
})

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands.get(interaction.commandName);

    if (!command) {
        console.log(chalk.red(`Command ${interaction.commandName} doens't exist.`));
        return;
    }

    try {
        await command.run(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Something happened.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: 'Something happened.', flags: MessageFlags.Ephemeral });
        }
    }
})

const rest = new REST().setToken(process.env.BOT_TOKEN as string);

(async () => {
    try {
        console.log(`Registering commands...`);

        const commandData = commands.map((cmd) => cmd.data.toJSON());

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID as string),
            { body: commandData },
        );

        console.log(chalk.green('Successfully registered commands.'))
    } catch (error) {
        console.error(error)
    }
})();

client.once('ready', readyclient => {
    console.log(chalk.bgGreen(`Online as ${readyclient.user.tag}!`));
});

client.login(process.env.BOT_TOKEN);