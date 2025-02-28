import express, {Request, Response} from 'express';
import {BufferCursor} from "./utils/BufferCursor";
import {GameEventOnMove, GamePacket,} from "./domain/models/GamePacketModels";
import {Cap} from 'cap';
import {WebSocketServer} from "ws";
import {PacketFactory} from "./domain/factories/PacketFactory";
import {EventGamePacketFactory} from "./domain/factories/EventGamePacketFactory";
import {OperationRequestGamePacketFactory} from "./domain/factories/OperationRequestGamePacketFactory";
import path from 'path';
import bodyParser from "body-parser";

const SHOULD_AUTO_DETECT_LISTENABLE_IP_ADDRESS = true;
const IPV4_LOCAL_NETWORK_PREFIX = '192.168';
const appPort = 3002;
let wss: WebSocketServer | undefined = undefined; // undefined as it is not initialized
let listenedIpAddress: string | undefined = undefined; // undefined as it is not initialized
let packetsListener: typeof Cap;


const main = () => {
    initializeHttpServer();
    initializeWebSocketServer();
    if (SHOULD_AUTO_DETECT_LISTENABLE_IP_ADDRESS && !listenedIpAddress) {
        listenedIpAddress = getIpAddressesThatCanBeListened()
            .filter(ip => ip.startsWith(IPV4_LOCAL_NETWORK_PREFIX))
            .at(0);
    }
    if (listenedIpAddress) initializeGamePacketListener();
};

interface Device {
    name: string;
    description: string;
    addresses: Address[];
}

interface Address {
    addr: string;
    netmask: string;
    broadaddr: string;
}

const initializeHttpServer = () => {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())
    app.use(express.static(path.join(__dirname, '../public')));

    app.get('/devices', (req: Request, res: Response) => {
        res.json({ devices: getIpAddressesThatCanBeListened()});
    });

    // Endpoint pour modifier la valeur de la variable
    app.post('/device', (req: Request, res: Response) => {

        console.log(req.body);
        const { newValue } = req.body;
        if (newValue) {
            listenedIpAddress = newValue;
            res.json({ success: true, message: `Variable modifiée en: ${listenedIpAddress}` });
            if (packetsListener) packetsListener.close();
            initializeGamePacketListener();
        } else {
            res.status(400).json({ success: false, message: "newValue est requis" });
        }
    });

    app.get('/device', (req: Request, res: Response) => {
        res.json({ currentDevice: listenedIpAddress });
    });

    app.listen(appPort, () => {
        console.log(`Ouba ouba ouba on http://localhost:${appPort}`);
    });
};
const initializeWebSocketServer = () => {
    wss = new WebSocketServer({
        port: 7777,
    });
    wss.on('connection', function connection(ws) {
        ws.on('error', console.error);

        ws.on('message', function message(data) {
            console.log('received: %s', data);
        });
    });
};

const initializeGamePacketListener = () => {

    const buffer = Buffer.alloc(32768);
    const gamePacketFactory = buildPacketFactory();
    packetsListener = new Cap();

    packetsListener.open(Cap.findDevice(listenedIpAddress), 'tcp port 5056 || udp port 5056', 32768, buffer);
    packetsListener.setMinBytes && packetsListener.setMinBytes(0);

    packetsListener.on('packet', (nbytes: any) => {
        let updPayload = new BufferCursor(buffer.subarray(42, nbytes)) // 42 should be the end of the IPV4 layer ; probably wrong on other setup
        let commandCount = updPayload.readUInt8(3); //peerId (int16BE) + flags (uInt8)
        updPayload.moveCursorPosition(8) // timestamp uInt32BE ? challenge int32BE ?

        if (nbytes - 42 < 12 + 8 + 4) return;
        for (let _ = 0; _ < commandCount; _++) {
            if (!gamePacketFactory.assertThatUdpPayloadIsValid(updPayload)) continue;
            const photonCommand = gamePacketFactory.BuildPhotonCommandFromBuffer(updPayload);
            const gamePacket = gamePacketFactory.BuildGamePacketFromPhotoCommand(photonCommand);

            if (gamePacket instanceof GameEventOnMove) {
            }
            wss!.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify(gamePacket));
                }
            });
        }
    });
};

const buildPacketFactory = (): PacketFactory => {
    const eventGamePacketFactory = new EventGamePacketFactory();
    const operationRequestGamePacketFactory = new OperationRequestGamePacketFactory();
    return new PacketFactory(eventGamePacketFactory, operationRequestGamePacketFactory);
};


const getIpAddressesThatCanBeListened = (): string[] => {
    return Cap.deviceList()
        .filter((device: Device) => device.addresses.length)
        .flatMap((devices: Device) => devices.addresses.map(device => device.addr));
};

main();

// const displaySourceAndDestinationAddresses = (buffer: Buffer): void => {
//     const ipv4Source = buffer.subarray(26, 30);
//     const ipv4Destination = buffer.subarray(31, 35);
//     console.log(`Source ${ipv4Source[0]}.${ipv4Source[1]}.${ipv4Source[2]}.${ipv4Source[3]}`);
//     console.log(`Desti ${ipv4Destination[0]}.${ipv4Destination[1]}.${ipv4Destination[2]}.${ipv4Destination[3]}`);
