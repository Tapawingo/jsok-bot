import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import path from 'path';
import { config } from '../config';
import routes from './routes';
import { Client } from 'discord.js';

export default (client: Client) => {
    if (!config.web?.enabled) return;

    const initStartTime = performance.now();
    console.info('Initializing Web App...', 'WEB');
    
    const app = express();
    const port = config.web.port;

    app.engine('handlebars', engine());
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, 'views'));

    app.use(bodyParser.json());
      

    routes(app, client);

    app.listen(port, () => {
        const initEndTime = performance.now();
        console.info(`Web App is listening on port ${ port } (${ (initEndTime - initStartTime).toFixed(2) } ms)`, 'WEB');
    })
}