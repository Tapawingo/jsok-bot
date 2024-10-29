import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, GuildMember, Interaction, InteractionCollector, ModalBuilder, PermissionFlagsBits, SlashCommandBuilder, TextChannel, TextInputBuilder, TextInputStyle, User } from 'discord.js';
import storage from 'node-persist';
import { config } from '../../../config';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_meeting')
		.setDescription('Create a meeting')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option => 
            option.setName('event_channel')
                .setDescription('Channel of event (must be a active event!)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('meeting_title')
                .setDescription('Title of meeting')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('meeting_description')
                .setDescription('Description of meeting')
                .setRequired(true)
        )
        .addBooleanOption(option => 
            option.setName('poll_date')
                .setDescription('Create a poll for meeting date?')
        )
        .addBooleanOption(option => 
            option.setName('query_date')
                .setDescription('Ask users to input times they are available.')
        ),
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        const eventChannel = interaction.options.getChannel('event_channel') as TextChannel;
        const meetingTitle = interaction.options.getString('meeting_title');
        const meetingDescription = interaction.options.getString('meeting_description');
        const usePoll = interaction.options.getBoolean('poll_date');
        const userQuery = interaction.options.getBoolean('query_date');

        await interaction.deferReply({ ephemeral: true });

        if (!meetingTitle || !meetingDescription) {
            await interaction.editReply('Missing meeting details');
            return;
        }

        if (!eventChannel?.isSendable()) {
            await interaction.editReply('Missing event channel');
            return;
        }

        if (usePoll) {
            return;
        }

        if (userQuery) {
            eventChannel.send(createAvailabilityQuery(eventChannel));
            return;
        }
	},
};

const createAvailabilityQuery = async (channel: TextChannel, meeting: any, event: any, guild: Guild, user: User | GuildMember) => {
    const openLink = new ButtonBuilder()
        .setURL(`${ config.web.url }:${ config.web.port }/${ guild.id }/${ event.id }/calendar/${ user.id }`)
        .setLabel('Unsubscribe')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder()
        .addComponents(openLink);

    await channel.send({ content: `# New Meeting!\n ${ meeting.name }`, components: [row as any] });
}

const createMeetingModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('create_event')
        .setTitle('Create JSOK Event')
    
    const eventNameInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Event Name')
        .setPlaceholder('Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)

    const eventDescriptionInput = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Event Description')
        .setPlaceholder('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)

    const eventLocationInput = new TextInputBuilder()
        .setCustomId('location')
        .setLabel('Event Location')
        .setPlaceholder('Location')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const eventStartInput = new TextInputBuilder()
        .setCustomId('start')
        .setLabel('Event Start')
        .setPlaceholder('DD-MM-YYYY HH:MM')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const eventEndInput = new TextInputBuilder()
        .setCustomId('end')
        .setLabel('Event End')
        .setPlaceholder('DD-MM-YYYY HH:MM')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    
    const rows: any = [
        new ActionRowBuilder().addComponents(eventNameInput),
        new ActionRowBuilder().addComponents(eventDescriptionInput),
        new ActionRowBuilder().addComponents(eventLocationInput),
        new ActionRowBuilder().addComponents(eventStartInput),
        new ActionRowBuilder().addComponents(eventEndInput)
    ];

    modal.addComponents(...rows);
    return modal;
}