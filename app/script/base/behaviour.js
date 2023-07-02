import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Action } from './action.js';

export const BehaviourType = {
    Passive: 'Passive',
    Immediately: 'Immediately',
    Initiative: 'Initiative',
};

export class Behaviour {
    name = "unnamed behaviour";
    type = BehaviourType.Initiative;
    uuid = NIL_UUID;
    actions = [];
    serial() {
        return {
            name: this.name,
            type: this.type,
            uuid: this.uuid,
            actions: this.actions.map(it => it.serial()),
        };
    }
    parse(data) {
        this.type = data.type;
        this.actions = data.actions.map(it => {
            if (Action.implDict.has(it.type)) {
                let ret = new (Action.implDict.get(it.type).Class)();
                ret.parse(it);
                return ret;
            }
            return null;
        }).filter(it => it !== null);
    }
    reID() {
        this.uuid = UUIDv4();
        for (let it of this.actions) {
            it.reID();
        }
    }
}
