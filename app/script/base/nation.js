import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';

export class Nation {
    name = "unnamed group";
    sub = [];
    uuid = NIL_UUID;
    color = -1;
    monarch = "";
    serial() {
        return {
            name: this.name,
            uuid: this.uuid,
            color: this.color,
            monarch: this.monarch,
            sub: this.sub.map(it => {
                if (it instanceof Nation) {
                    return it.serial();
                } else {
                    return it.uuid;
                }
            }),
        };
    }
    parse(data, pieceList) {
        this.name = data.name;
        this.uuid = data.uuid;
        this.color = data.color;
        this.monarch = data.monarch;
        this.sub = data.sub.map(it => {
            if (typeof(it) == 'string') {
                return pieceList.find(p => p.uuid == it);
            } else {
                let instance = new Nation();
                instance.parse(it);
                return instance;
            }
        });
    }
    reID() {
        this.uuid = UUIDv4();
        for (let it of this.sub) {
            if (it instanceof Nation) {
                it.reID();
            }
        }
    }
}
