import { Guild, Interaction, orderedList, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import storage from 'node-persist';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_events')
		.setDescription('Lists all events')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;
        const guild = interaction.guild;

        await interaction.deferReply({ ephemeral: true });

        if (!guild) {
            interaction.editReply('Guild is missing');
            return;
        }
        
        try {
            await storage.init({ dir: __dirname + '/../../../db/' });
            
            let guildConfig = (await storage.getItem(guild.id)) ?? {};
            if (!guildConfig.event) guildConfig.event = {};
            if (!guildConfig.event.events) guildConfig.event.events = [];

            await interaction.editReply({ content: createList(guild, guildConfig.event.events) });
        } catch (e: any) {
            console.error(e, 'BOT');
            await interaction.editReply({ content: 'Something went wrong.' });
        }
	},
};

const createList = (guild: Guild, events: any[]) => {    
    let roleStrings: string[] = [];
    events.forEach(event => {
        roleStrings.push(`**${ event.name }** • ${ event.description }`);
    });

    const list = orderedList(roleStrings);

    return list;
}