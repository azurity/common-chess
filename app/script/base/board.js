import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Entity } from "./entity.js";
import { Nation } from "./nation.js";
import { Player } from './player.js';
import { Monitor } from './Monitor.js';

export class Board {
    type = "";
    name = "unnamed board";
    uuid = NIL_UUID;
    pieces = [];
    nations = [];
    players = [];
    monitors = [];
    state = null;
    static implDict = new Map();
    serial() {
        return {
            type: this.type,
            name: this.name,
            uuid: this.uuid,
            state: JSON.parse(JSON.stringify(this.state)),
            players: this.players.map(it => it.serial()),
            pieces: this.pieces.map(it => it.serial()),
            nations: this.nations.map(it => it.serial()),
            monitors: this.monitors.map(it => it.serial()),
        }
    }
    parse(data) {
        this.type = data.type;
        this.name = data.name;
        this.uuid = data.uuid;
        this.state = JSON.parse(JSON.stringify(data.state));
        this.pieces = data.pieces.map(it => {
            let instance = new Entity();
            instance.parse(it);
            return instance;
        });
        this.nations = data.nations.map(it => {
            let instance = new Nation();
            instance.parse(it, this.pieces);
            return instance;
        });
        this.players = data.players.map(it => {
            let instance = new Player();
            instance.parse(it, this.nations);
            return instance;
        });
        this.monitors = data.monitors.map(it => {
            let Class = Monitor.implDict.find(item => item[0] == it.type)[1];
            let instance = new Class(this);
            instance.parse(it);
            return instance;
        });
        if (this.monitors.length == 0 && Monitor.implDict.length != 0) {
            this.monitors = Monitor.implDict.map(it => {
                let instance = new it[1](this);
                instance.init();
                return instance;
            });
        }
    }
    reID() {
        this.uuid = UUIDv4();
        for (let it of this.pieces) {
            it.reID();
        }
        for (let it of this.nations) {
            it.reID();
        }
    }
}

export class BoardInfo {
    Class = Board;
    colormap = []; // ['#000000']
    editor = (ref) => { return null; };
    game = (ref, play) => { return null }; // setModel setState
}
