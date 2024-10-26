import { ChannelType, Interaction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import storage from 'node-persist';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_event_categories')
		.setDescription('Set event categories.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('events_category')
                .setDescription('Category channel for events')
                .addChannelTypes(ChannelType.GuildCategory)
        )
        .addChannelOption(option =>
            option.setName('archived_category')
                .setDescription('Category channel for archived events')
                .addChannelTypes(ChannelType.GuildCategory)
        ),
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        const guild = interaction.guild;
        const eventsCategory = interaction.options.getChannel('events_category');
        const archivedCategory = interaction.options.getChannel('archived_category');

        if (!guild) {
            console.warn('Missing guild');
            await interaction.reply('Missing guild.');
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            await storage.init({ dir: __dirname + '/../../../db/' });
            
            let guildConfig = (await storage.getItem(guild.id)) ?? {};
            if (!guildConfig.event) guildConfig.event = {};
            
            if (eventsCategory) {
                guildConfig.event.eventCategory = eventsCategory.id;
            }

            if (archivedCategory) {
                guildConfig.event.archivedCategory = archivedCategory.id;
            }

            await storage.setItem(guild.id, guildConfig);

            interaction.editReply('Set categories');
        } catch (e: any) {
            console.error(e, 'BOT');
            await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
        }
	},
};