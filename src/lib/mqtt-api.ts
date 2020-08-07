import {Coder} from "./coder";
import mqtt from 'mqtt';
import {MqttClient} from "mqtt/types/lib/client";
import {Keys} from "./keys";
import {Ecies} from "eccrypto";
import {Buffer} from "buffer";

export class MqttApi {
    private client: MqttClient

    constructor(private coder: Coder,
                private address: string,
                private port: number,
                subscribeCallback: (topic, payload) => any) {
        this.client = mqtt.connect(`mqtt://${address}:${port}`)
        this.client.on('connect', () => console.log('S-MQTT connected'));
        this.subscribe('initial');
        this.client.on('message', (topic, message) => {
            if (topic === 'initial') {
                const keys: Keys = JSON.parse(message.toString('utf8'));
                keys.inputPublicKey = Buffer.from(keys.inputPublicKey)
                keys.outputPrivateKey = Buffer.from(keys.outputPrivateKey);
                this.coder.keys = keys;
            } else {
                const inputString = Buffer.from(message.toString('utf8'), 'base64').toString('utf8');
                const inputJson = JSON.parse(inputString);
                inputJson.iv = Buffer.from(inputJson.iv);
                inputJson.ephemPublicKey = Buffer.from(inputJson.ephemPublicKey);
                inputJson.ciphertext = Buffer.from(inputJson.ciphertext);
                inputJson.mac = Buffer.from(inputJson.mac);
                this.coder.decode(inputJson).then(decrypted => subscribeCallback(topic, decrypted));
            }
        })
    }

    subscribe(topic: string) {
        this.client.subscribe(topic, (err => console.log(err)));
    }

    async publish(topic: string, message: string) {
        const ecies: Ecies = await this.coder.encode(message);
        const encodedMessage = Buffer.from(JSON.stringify(ecies)).toString('base64');
        this.client.publish(topic, Buffer.from(encodedMessage));
    }
}
