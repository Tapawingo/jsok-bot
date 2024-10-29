import { Client } from 'discord.js';
import express from 'express';
import path from 'path';
import type { Express } from 'express';
import storage from 'node-persist';


export default async (app: Express, client: Client) => {
    await storage.init({ dir: __dirname + './../db/' });

    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.render('index')
    });

    app.get('/:guildId/:eventId/calendar/:userId', async (req, res) => {
        const guildId = req.params.guildId;
        const guildConfig = await storage.getItem(guildId);
        
        const guild = client.guilds.cache.get(guildId);
        if (!guildConfig || !guild) {
            res.send('Unknown guild');
            return;
        }
        
        const userId = req.params.userId;
        const user = guild?.members.cache.get(userId);
        if (!user) {
            res.send('Unknown user');
            return;
        }
        
        const eventId = req.params.eventId;
        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.events) guildConfig.event.events = [];
        const event = guildConfig.event.events.find((event: any) => event.id === eventId);
        
        if (!event) {
            res.send('Unknown event');
            return;
        }
        
        res.render('calendar', { 
            layout: 'calendar', 
            event: JSON.stringify(event), 
            guild: JSON.stringify(guild), 
            user: JSON.stringify(user)
        });
    });

    app.post('/api/submitAvailability', async (req, res) => {
        const guild = client.guilds.cache.get(req.body.guild?.id);
        const guildConfig = await storage.getItem(req.body.guild?.id);
        if (!guild || !guildConfig) { res.status(400); res.send('Unknown guild'); return; }
        
        const user = guild?.members.cache.get(req.body.user?.id);
        if (!user) { res.status(400); res.send('Unknown user'); return; }
        
        const event = req.body.event;
        if (!event) { res.status(400); res.send('Unknown event'); return; }

        if (!guildConfig.event) guildConfig.event = {};
        if (!guildConfig.event.meetings) guildConfig.event.meetings = [];

        

        res.status(200);
        res.send(JSON.stringify({ status: 200 }));
    });
}