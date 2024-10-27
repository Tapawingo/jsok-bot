import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Client, Events, GuildChannel, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, TextChannel } from "discord.js";
import storage from 'node-persist';
import cuuid from '../../utils/createId';

const getDate = (dateString: string): Date => {
    if (!/^\d{1,2}-\d{1,2}-\d{2,4} \d{1,2}:\d{1,2}$/.test(dateString)) {
        console.log('invalid date format');
        return new Date(dateString);
    };

    const date = dateString.split(' ')[0].split('-');
    const time = dateString.split(' ')[1].split(':');

    const dateObj = new Date();
    dateObj.setFullYear(parseInt(date[2]), parseInt(date[1]), parseInt(date[0]));
    dateObj.setHours(parseInt(time[0]), parseInt(time[1]));

    return dateObj;
}

export default (client: Client) => {
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isModalSubmit() || interaction.customId != 'create_event') return;
        const guild = interaction.guild;
        const eventName = interaction.fields.getTextInputValue('name');
        const eventDescription = interaction.fields.getTextInputValue('description');
        const eventLocation = interaction.fields.getTextInputValue('location');
        const eventStart = interaction.fields.getTextInputValue('start');
        const eventEnd = interaction.fields.getTextInputValue('end');

        await storage.init({ dir: __dirname + '/../../db/' });
        
        await interaction.deferReply({ ephemeral: true });
        
        if (!guild || !eventName) {
            console.warn(`Missing guild or event name.`);
            interaction.editReply('Missing event name.');
            return;
        }

        if (eventStart && !getDate(eventStart)) {
            console.warn(`Invalid date format for start date.`);
            await interaction.editReply(`Invalid date format for start date.`);
            return;
        }

        if (eventEnd && !getDate(eventEnd)) {
            console.warn(`Invalid date format for end date.`);
            await interaction.editReply(`Invalid date format for end date.`);
            return;
        }

        let guildConfig = (await storage.getItem(guild.id)) ?? {};
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];

        const finalName = eventName.replace(' ', '-') /* + (eventStart ? '-' + getDate(eventStart).getFullYear() : '') */;

        let channel = guild.channels.cache.find(channel => channel.name.toLowerCase() === finalName.toLowerCase());
        if (!channel) {
            try {
                channel = await guild.channels.create({
                    name: finalName,
                    type: ChannelType.GuildText
                });

                channel.setTopic(eventDescription);

                const eventCategory = guild.channels.cache.get(guildConfig.event.eventCategory);
                if (eventCategory && eventCategory.type === ChannelType.GuildCategory) {
                    channel.setParent(eventCategory);
                }
            } catch (e: any) {
                console.error(e);
                await interaction.editReply('Failed to create event channel.');
                return;
            }
        } else {
            await interaction.editReply('Channel already exists... continuing');
        }

        let schedule;
        if (eventStart && eventEnd) {
            schedule = await guild.scheduledEvents.create({
                name: eventName,
                scheduledStartTime: getDate(eventStart),
                scheduledEndTime: getDate(eventEnd),
                entityMetadata: {
                    location: eventLocation ?? 'N/A'
                },
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                entityType: GuildScheduledEventEntityType.External,
                description: eventDescription
            })
        }

        let role;
        try {
            role = await guild.roles.create({
                name: `${ eventName } Attendee`,
                color: Math.floor(Math.random()*16777215),
                mentionable: true,
                position: guild.roles.highest.position
            })
        } catch (e: any) {
            console.warn(e);
        }

        const event = {
            id: cuuid(),
            name: eventName,
            description: eventDescription,
            channel: channel.id,
            schedule: schedule?.id,
            role: role?.id
        };

        guildConfig.event.events.push(event);

        await storage.setItem(guild.id, guildConfig);
        await interaction.editReply(`Created event (id: ${ event.id }).`);

        if (interaction.channel?.isSendable() && schedule) {
            const message = await interaction.channel.send({ content: `# New Event "${ eventName }"![⠀](${ schedule.url })\n ${ channel }` })
            message.suppressEmbeds(true);
        } else if (interaction.channel?.isSendable()) {
            createUnscheduledEvent(interaction.channel as TextChannel, channel as TextChannel);
        }

        if (channel.isSendable() && schedule) {
            const message = await channel.send({ content: `# New Event "${ eventName }"![⠀](${ schedule.url })\n ${ channel }` })
            message.suppressEmbeds(true);
        } else if (channel.isSendable()) {
            await channel.send(`# New Event!\n ${ channel }`);
            createUnscheduledEvent(channel as TextChannel, channel as TextChannel);
        }
    });
}

const createUnscheduledEvent = async (channel: TextChannel, eventChannel: TextChannel) => {
    const uninterestedButton = new ButtonBuilder()
        .setCustomId(`unscheduled_event_unsubscribe`)
        .setLabel('Unsubscribe')
        .setStyle(ButtonStyle.Secondary);

    const interestedButton = new ButtonBuilder()
        .setCustomId('unscheduled_event_subscribe')
        .setLabel('Subscribe')
        .setStyle(ButtonStyle.Primary);
    
    const row = new ActionRowBuilder()
        .addComponents(uninterestedButton, interestedButton);

    await channel.send({ content: `# New Event!\n ${ eventChannel }`, components: [row as any] });
}