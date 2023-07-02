import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Behaviour } from './behaviour.js';

export class Entity {
    depth = 0;
    name = "unnamed piece";
    type = NIL_UUID;
    uuid = NIL_UUID;
    behaviours = [];
    img = "";
    serial() {
        return {
            name: this.name,
            type: this.type,
            uuid: this.uuid,
            img: this.img,
            behaviours: this.behaviours.map(it => it.serial()),
        }
    }
    parse(data) {
        this.name = data.name;
        this.type = data.type;
        this.uuid = data.uuid;
        this.img = data.img;
        this.behaviours = data.behaviours.map(it => {
            let ret = new Behaviour();
            ret.parse(it);
            return ret;
        });
    }
    reID() {
        this.uuid = UUIDv4();
        for (let it of this.behaviours) {
            it.reID();
        }
    }
}
