import { ChannelType, Client, Events, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from 'discord.js';
import storage from 'node-persist';
import createEventHandler from './createEvent';

module.exports = async (client: Client) => {
    createEventHandler(client);

    client.on(Events.GuildScheduledEventUserAdd, async (schedule, user) => {
        console.debug(`Received Guild Scheduled Event User Add`);
        const guild = schedule.guild;
        
        if (!guild) return;
        const member = guild.members.cache.get(user.id);
        if (!member) return;

        await storage.init({ dir: __dirname + '/../../db/' });
        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.schedule.id === schedule.id);
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

        await storage.init({ dir: __dirname + '/../../db/' });
        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const event = guildConfig.event.events.find((event: any) => event.schedule.id === schedule.id);
        if (!event) return;

        const role = event.role;
        member.roles.remove(role);
    });
}