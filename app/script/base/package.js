import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Entity } from './entity.js';

export class Package {
    name = "unnamed package";
    uuid = NIL_UUID;
    entities = [];
    serial() {
        return {
            name: this.name,
            uuid: this.uuid,
            entities: this.entities.map(it => it.serial()),
        }
    }
    parse(data) {
        this.name = data.name;
        this.uuid = data.uuid;
        this.entities = data.entities.map(it => {
            let ret = new Entity();
            ret.parse(it);
            return ret;
        });
    }
    reID() {
        this.uuid = UUIDv4();
        for (let it of this.entities) {
            it.reID();
        }
    }
}
