import { NIL as NIL_UUID } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';

export class Player {
    direct = 0;
    // nation = null;
    uuid = NIL_UUID;
    user = NIL_UUID;
    serial() {
        return {
            direct: this.direct,
            // nation: this.nation.uuid,
            uuid: this.uuid,
            user: this.user,
        };
    }
    parse(data, nationList) {
        this.direct = data.direct;
        // this.nation = nationList.find(it => it.uuid == data.nation);
        this.uuid = data.uuid;
        this.user = data.user;
    }
}
