import path from 'node:path'
import fs from 'node:fs'
import { REST, Routes } from "discord.js";
import { config } from './config';
require('./utils/console.ts');

const registeredCommands: any[] = [];

const modulesPath = path.join(__dirname, 'modules');
const modules = fs.readdirSync(modulesPath);

for (const module of modules) {
    const modulePath = path.join(modulesPath, module);
    const commandsPath = path.join(modulePath, 'commands');

    if (fs.existsSync(commandsPath)) {
        const commands = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
        
        for (const file of commands) {
            const commandPath = path.join(commandsPath, file);
            const command = require(commandPath);

            if ('data' in command && 'execute' in command) {
                registeredCommands.push(command.data.toJSON());
            } else {
                console.warn(`The command at ${ commandPath } is missing a required "data" or "execute" property.`);
            }
        }
    }
};

const rest = new REST().setToken(config.bot.token);

(async () => {
	try {
		console.info(`Started refreshing ${ registeredCommands.length } application (/) commands.`, 'BOT');

		await rest.put(
            Routes.applicationCommands(config.bot.client_id),
            { body: registeredCommands },
        );

		console.info(`Successfully deployed application (/) commands.`, 'BOT');
	} catch (error) {
		console.error(error, 'BOT');
	}
})();