import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, Events, GuildScheduledEvent, GuildScheduledEventEntityType, GuildScheduledEventManagerFetchSubscribersResult, GuildScheduledEventPrivacyLevel } from 'discord.js';
import storage from 'node-persist';
import createEventHandler from './createEvent';

module.exports = async (client: Client) => {
    createEventHandler(client);

    await storage.init({ dir: __dirname + '/../../db/' });

    client.on(Events.GuildScheduledEventUserAdd, async (schedule, user) => {
        console.debug(`guildScheduledEventUserAdd: ${schedule} | ${user}`, 'BOT');
        const guild = schedule.guild;
        
        if (!guild) return;
        const member = guild.members.cache.get(user.id);
        if (!member) return;

        
        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.schedule === schedule.id);
        if (!event) return;

        const role = event.role;
        member.roles.add(role);
    });

    client.on(Events.GuildScheduledEventUserRemove, async (schedule, user) => {
        console.debug(`Received Guild Scheduled Event User Removed`);
        const guild = schedule.guild;
        
        if (!guild) return;
        const member = guild.members.cache.get(user.id);
        if (!member) return;

        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.schedule === schedule.id);
        if (!event) return;

        const role = event.role;
        member.roles.remove(role);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isMessageComponent() || interaction.customId !== 'unscheduled_event_subscribe') return;
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const channel = interaction.channel;
        if (!guild) {
            console.warn('No guild for interaction');
            await interaction.editReply(`Missing guild`);
            return;
        }

        if (!interaction.member) {
            console.warn('No member for interaction');
            await interaction.editReply(`Missing user`);
            return;
        }

        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.channel === channel?.id);
        if (!event) return;

        const role = event.role;
        (interaction.member.roles as any).add(role);
        await interaction.editReply(`Subscribed to event`);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isMessageComponent() || interaction.customId !== 'unscheduled_event_unsubscribe') return;
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const channel = interaction.channel;
        if (!guild) {
            console.warn('No guild for interaction');
            await interaction.editReply(`Missing guild`);
            return;
        }

        if (!interaction.member) {
            console.warn('No member for interaction');
            await interaction.editReply(`Missing user`);
            return;
        }

        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.channel === channel?.id);
        if (!event) return;

        const role = event.role;
        (interaction.member.roles as any).remove(role);
        await interaction.editReply(`Unsubscribed from event`);
    });
}