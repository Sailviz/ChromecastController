require('dotenv').config()
import express, { Express } from 'express';
import * as http from 'http';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
const ChromecastAPI = require('chromecast-api')

if (process.env.PORT) {
    var port: number = parseInt(process.env.PORT);
}

const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
    const app: Express = express();
    const server: http.Server = http.createServer(app);
    const io: socketio.Server = new socketio.Server();
    io.attach(server);

    io.on('connection', async (socket: socketio.Socket) => {
        socket.on('disconnect', () => {
            socket.disconnect()
        })

        socket.on("Register", async () => {

        })

    });

    app.all('*', (req: any, res: any) => nextHandler(req, res));

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });


    var client = new ChromecastAPI();
    client.on('device', function (device: any) {
        console.log(device.friendlyName)
        device.play("", "customreceiver", function (err: any) {
            if (!err) console.log('Playing in your chromecast')
        })
        setTimeout(() => {
            device.sendMessage({ type: 'clubId', clubId: "fc4923c2-3f2a-45c5-8a7e-078ea5a9693d" }, function (err: any) {
                console.log(err)
            })
        }, 10000)
    })

});