require('dotenv').config()
import express, { Express } from 'express';
import * as https from 'https';
import next, { NextApiHandler } from 'next';
import * as socketio from 'socket.io';
const ChromecastAPI = require('chromecast-api')
var path = require('path');
var fs = require('fs');

if (process.env.PORT) {
    var port: number = parseInt(process.env.PORT);
}

const dev: boolean = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
    var clubId = ""
    const app: Express = express();
    var options = {
        key: fs.readFileSync(path.resolve('dist/server.key')),
        cert: fs.readFileSync(path.resolve('dist/server.cert'))
    };
    const server: https.Server = https.createServer(options, app);
    const io: socketio.Server = new socketio.Server();
    io.attach(server);

    io.on('connection', async (socket: socketio.Socket) => {
        socket.on('disconnect', () => {
            socket.disconnect()
        })

        socket.on("register", async (clubId: string, callback) => {
            clubId = clubId
            callback({ status: true })
        })

        socket.on("getAvailableCasts", async (callback) => {
            callback({ casts: devices })
        });

        socket.on("connectCast", async (host: any, callback) => {
            const cast = client.devices.find((d: any) => d.host === host)
            if (cast == undefined) {
                callback({ status: false, cast: {} })
                return
            }
            cast.play("", "customreceiver", function (err: any) {
                if (!err) callback({ status: true, cast: { host: cast.host, name: cast.friendlyName } })
                var index = devices.findIndex((d: any) => d.host === cast.host)
                devices[index] = { host: cast.host, name: cast.friendlyName, connected: true }

                console.log("updated: " + cast.host + " - " + "true")
            })
        });

        socket.on("disconnectCast", async (host: any, callback) => {
            const cast = client.devices.find((d: any) => d.host === host)
            if (cast == undefined) {
                callback({ status: false, cast: {} })
                return
            }
            cast.stop(function (err: any) {
                if (err) return console.error(err)
                var index = devices.findIndex((d: any) => d.host === cast.host)
                devices[index] = { host: cast.host, name: cast.friendlyName, connected: false }
                callback({ status: true, cast: { host: cast.host, name: cast.friendlyName } })
                console.log("updated: " + cast.host + " - " + "false")
            })
        });

        socket.on("messageCast", async (host: any, message: any, callback) => {
            const cast = client.devices.find((d: any) => d.host === host)
            if (message.data['type'] == 'clubId') {
                clubId = (message.data['clubId'])
            }
            if (cast == undefined || cast == null) {
                callback({ status: false, cast: {} })
                console.log('cast not found')
                return
            }
            cast.sendMessage(message, function (response: any) {
                console.log('response')
                console.log(response)
                callback({ status: true, response: response })
            })
        });
    })

    app.all('*', (req: any, res: any) => nextHandler(req, res));

    server.listen(port, () => {
        console.log(`> Ready on https://localhost:${port}`);
    });

    // function getStatus(device: any) {
    //     return new Promise(resolve => {
    //         device.getReceiverStatus(function (err: any, status: any) {
    //             if (err) return console.error(err)
    //             resolve(status)
    //         })
    //     })
    // }


    var client = new ChromecastAPI();
    var devices: any[] = []
    client.on('device', async function (device: any) {
        console.log(device)
        device.play("", "customreceiver")
        devices.push({ host: device.host, name: device.name, status: 'connected' })

        setInterval(async function () {
            try {
                console.log('forcing device ' + device.friendlyName + ' to play')
                device.play("", "customreceiver")
                device.sendMessage({ type: "clubId", clubId: clubId })
            } catch (err) {
                console.log('device ' + device.friendlyName + ' not found')
            }
        }, 10000)


        // device.play('http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4', "media")
        //if we try and message the device to see if our application is alive, we can get the status of the device
        // device.sendMessage({ type: 'PING' }, function (response: any)
        // if we get a response, we can assume the device is alive
        // if not, we can assume the device is dead, and we can realive it.

        device.on('status', async function (status: any) {
            //check if the device is configured to a player
            if (status.player != undefined) {
                status.sendMessage({ type: 'clubId', data: '', id: '' }, async function (response: any) {
                    console.log('response')
                    console.log(response)
                    if (response == 'success') {
                        //do nothing, device is already configured
                    } else {
                        device.play("", "customreceiver")
                    }
                })
            } else {
                //if the device is not playing then we can play a video
                device.play("", "customreceiver")
            }
        })
    })
});


// IF THERE IS AN ERROR ABOUT ERR_OSSL_EVP_UNSUPPORTED, TRY THIS:
// set NODE_OPTIONS=--openssl-legacy-provider