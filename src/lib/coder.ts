import {Keys} from "./keys";
import eccrypto, {Ecies} from 'eccrypto';

export class Coder {
    keys: Keys;

    public async encode(data: string): Promise<Ecies> {
        return await eccrypto.encrypt(this.keys.inputPublicKey, Buffer.from(data));
    }

    public async decode(data: Ecies): Promise<Buffer> {
        return await eccrypto.decrypt(this.keys.outputPrivateKey, data);
    }
}
