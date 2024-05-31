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
            callback("success")
        })

        socket.on("getAvailableCasts", async (callback) => {
            callback({ casts: devices })
        });

        socket.on("connectCast", async (host: any, callback) => {
            console.log(host)
            const cast = client.devices.find((d: any) => d.host === host)
            if (cast == undefined) {
                callback({ status: false, cast: {} })
            }
            cast.play("", "customreceiver", function (err: any) {
                if (!err) callback({ status: true, cast: { host: cast.host, name: cast.friendlyName } })
            })
            var index = devices.findIndex((d: any) => d.host === cast.host)
            devices[index] = { host: cast.host, name: cast.friendlyName, connected: true }

            console.log("updated: " + cast.host + " - " + "true")
        });

        socket.on("disconnectCast", async (host: any, callback) => {
            console.log(host)
            const cast = client.devices.find((d: any) => d.host === host)
            if (cast == undefined) {
                callback({ status: false, cast: {} })
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
            if (cast == undefined) {
                callback({ status: false, cast: {} })
            }
            cast.sendMessage(message, function (response: any) {
                callback({ status: true, response: response })
            })
        });
    })

    app.all('*', (req: any, res: any) => nextHandler(req, res));

    server.listen(port, () => {
        console.log(`> Ready on https://localhost:${port}`);
    });

    function getStatus(device: any) {
        return new Promise(resolve => {
            device.getReceiverStatus(function (err: any, status: any) {
                if (err) return console.error(err)
                resolve(status)
            })
        })
    }


    var client = new ChromecastAPI();
    var devices: any[] = []
    client.on('device', async function (device: any) {
        var connected = false
        const status: any = await getStatus(device)
        connected = false
        if (status.applications) {
            status.applications.forEach((app: any) => {
                if (app.appId == "0AA4CA7E") {
                    connected = true
                }
            })
        }
        var index = devices.findIndex((d: any) => d.host === device.host)
        if (index == -1) {
            devices.push({ host: device.host, name: device.friendlyName, connected: connected })
        } else {
            devices[index] = { host: device.host, name: device.friendlyName, connected: connected }
        }
        console.log("found: " + device.host + " - " + connected)
    })
});