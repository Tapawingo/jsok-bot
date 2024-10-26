import { ChannelType, GuildScheduledEvent, GuildScheduledEventStatus, Interaction, PermissionFlagsBits, Role, SlashCommandBuilder, TextChannel } from 'discord.js';
import storage from 'node-persist';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('archive_event')
		.setDescription('Archive event.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addNumberOption(option =>
            option.setName('event_index')
                .setDescription('Index of event from /list_events')
                .setRequired(true)
        ),
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        const guild = interaction.guild;
        const eventIndex = interaction.options.getNumber('event_index')!;

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
            if (!guildConfig.event.events) guildConfig.event.events = [];

            const event = guildConfig.event.events[eventIndex - 1];
            guildConfig.event.events.splice(eventIndex - 1, 1);

            const channel = guild.channels.cache.get(event.channel) as TextChannel;
            const archivedCategory = guild.channels.cache.get(guildConfig.event.archivedCategory);
            if (channel && archivedCategory && archivedCategory.type === ChannelType.GuildCategory) {
                channel.setParent(archivedCategory)
                
                if (channel.isSendable()) {
                    channel.send(`⠀\n# EVENT ARCHIVED\n⠀`);
                }
            }

            const schedule = guild.scheduledEvents.cache.get(event.schedule);
            if (schedule?.scheduledStartAt) {
                if (schedule.scheduledStartAt < new Date()) {
                    schedule.setStatus(GuildScheduledEventStatus.Completed)
                } else {
                    schedule.setStatus(GuildScheduledEventStatus.Canceled)
                }
            }

            const role = guild.roles.cache.get(event.role) as Role;
            await role.delete();

            await storage.setItem(guild.id, guildConfig);

            interaction.editReply('Archived event');
        } catch (e: any) {
            console.error(e, 'BOT');
            await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
        }
	},
};