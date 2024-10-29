import { ActionRowBuilder, Interaction, ModalBuilder, PermissionFlagsBits, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_event')
		.setDescription('Create an event')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        try {
            await interaction.showModal(createModal());
        } catch (e: any) {
            console.error(e, 'BOT');
            await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
        }
	},
};

const createModal = () => {
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