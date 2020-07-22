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
                const inputJson = JSON.parse(((message).toString('utf8')));
                inputJson.iv = Buffer.from(inputJson.iv);
                inputJson.ephemPublicKey = Buffer.from(inputJson.ephemPublicKey);
                inputJson.ciphertext = Buffer.from(inputJson.ciphertext);
                inputJson.mac = Buffer.from(inputJson.mac);
                const decrypted = this.coder.decode(inputJson);
                subscribeCallback(topic, decrypted);
            }
        })
    }

    subscribe(topic: string) {
        this.client.subscribe(topic, (err => console.log(err)));
    }

    async publish(topic: string, message: string) {
        const ecies: Ecies = await this.coder.encode(message);
        this.client.publish(topic, Buffer.from(JSON.stringify(ecies)));
    }
}
