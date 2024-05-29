require('dotenv').config()
import express, { Express } from 'express';
import * as http from 'http';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
import { Client } from 'castv2';
import { Browser } from '@astronautlabs/mdns';



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



    new Browser('_googlecast._tcp')
        .on('serviceUp', (service: any) => ondeviceup(service))
        .on('serviceDown', (service: any) => console.log("Device down: ", service))
        .start();

    function ondeviceup(host: any) {
        console.log(host)
        var client = new Client();
        client.connect(host, function () {
            // create various namespace handlers
            var connection = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.connection', 'JSON');
            var heartbeat = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.tp.heartbeat', 'JSON');
            var receiver = client.createChannel('sender-0', 'receiver-0', 'urn:x-cast:com.google.cast.receiver', 'JSON');

            // establish virtual connection to the receiver
            connection.send({ type: 'CONNECT' });

            // start heartbeating
            setInterval(function () {
                heartbeat.send({ type: 'PING' });
            }, 5000);

            // launch app
            receiver.send({ type: 'LAUNCH', appId: '0AA4CA7E', requestId: 1 });

            // display receiver status updates
            receiver.on('message', function (data: any, broadcast: any) {
                if (data.type = 'RECEIVER_STATUS') {
                    console.log(data.status, broadcast);
                }
            });
        });

    }

});