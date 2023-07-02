const { Server, Socket } = require('socket.io');
const UUID = require('uuid');
const { getResource } = require('./resource');

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

const GameStatus = {
    prepare: "prepare",
    play: "play",
};

class Room {
    uuid;
    type = "";
    info = null;
    N = 0;
    players = [];
    status;
    statusExtra = null;
    online = new Set();
    round = 0;
    subRound = 0;
    losers = [];
    canceller = null;

    constructor(type) {
        this.uuid = UUID.v4();
        this.type = type;
        this.info = getResource(type);
        this.N = this.info.data.players.length;
        this.status = GameStatus.prepare;
        this.statusExtra = new Set();
        this.round = 0;
        this.subRound = 0;
        this.losers = [];
    }

    serial() {
        return {
            play: this.status == GameStatus.play,
            type: this.type,
            players: this.players,
            status: this.status,
            statusExtra: JSON.parse(JSON.stringify(this.statusExtra)),
            round: this.round,
            subRound: this.subRound,
            losers: this.losers,
        };
    }

    play() {
        this.status = GameStatus.play;
        this.statusExtra = JSON.parse(JSON.stringify(this.info.data));
        shuffle(this.players);
    }
}

let roomInfo = new Map();

module.exports = function (server) {
    const io = new Server(server, {
        transports: ["websocket"],
        pingInterval: 5000,
    });

    io.on('connection', client => {
        let uuid = "";
        client.emit("uuid");
        client.on("uuid", (id) => {
            uuid = id;
        });

        let roomId = "";
        client.on("room-info", (callback) => {
            for (let it of roomInfo.values()) {
                if (it.players.find(u => u == uuid)) {
                    roomId = it.uuid;
                    callback(it.serial());
                    client.join(roomId);
                    let room = roomInfo.get(roomId);
                    if (room.canceller != null) {
                        clearTimeout(room.canceller);
                    }
                    return;
                }
            }
            roomId = "";
            callback(null);
        });

        client.on("new-room", (type, callback) => {
            if (roomId != "") {
                callback("");
                return;
            }
            let room = new Room(type);
            roomInfo.set(room.uuid, room);
            callback(room.uuid);
        });

        client.on("room-list", (callback) => {
            if (roomId != "") {
                callback(null);
                return;
            }
            callback([...roomInfo.entries()].filter(([k, v]) => v.status == GameStatus.prepare).map(([k, v]) => ({
                type: v.type,
                uuid: k,
                players: v.players,
                N: v.N,
            })));
        });

        client.on("disconnecting", () => {
            if (roomId != "") {
                let room = roomInfo.get(roomId);
                if (room == undefined) {
                    roomId = "";
                    return;
                }
                room.online.delete(uuid);
                client.to(roomId).emit("offline", uuid);
                if (room.online.size == 0) {
                    room.canceller = setTimeout(() => {
                        let room = roomInfo.get(roomId);
                        if (room != null && room.online.size == 0) {
                            roomInfo.delete(roomId);
                        }
                    }, 300 * 1000);
                }
            }
        });

        client.on("join", (rid, callback) => {
            if (roomId != "" || !roomInfo.has(rid)) {
                callback(false);
                return;
            }
            let room = roomInfo.get(rid);
            if (room.status != GameStatus.prepare || room.N <= room.players.length) {
                callback(false);
                return;
            }
            roomId = rid;
            room.players.push(uuid);
            room.online.add(uuid);
            client.join(roomId);
            callback(true);
        });

        client.on("exit-room", (callback) => {
            if (roomId != "") {
                client.to(roomId).emit("exit-room", uuid);
                io.in(roomId).socketsLeave(roomId);
                roomInfo.delete(roomId);
            }
            callback();
        });

        client.on("ready", () => {
            if (!roomInfo.has(roomId)) {
                return;
            }
            let room = roomInfo.get(roomId);
            if (room.status != GameStatus.prepare) {
                return;
            }
            room.statusExtra.add(uuid);
            if (room.statusExtra.size == room.N) {
                room.play();
                io.to(roomId).emit("start", room.serial());
            }
        });

        // in game action
        client.on("step", (state, losers, callback) => {
            if (roomId == "") {
                callback(false);
                return;
            }
            let room = roomInfo.get(roomId);
            if (room == undefined) {
                callback(false);
                return;
            }
            if (room.status != GameStatus.play) {
                callback(false);
                return;
            }
            if (room.round % room.players.length != room.players.findIndex(it => it == uuid)) {
                callback(false);
                return;
            }
            room.losers = losers;
            room.statusExtra = state;
            room.subRound += 1;
            client.to(roomId).emit("step", room.serial());
            callback(true);
            console.log("step");
        });

        client.on("fin-round", (callback) => {
            if (roomId == "") {
                callback(false);
                return;
            }
            let room = roomInfo.get(roomId);
            if (room == undefined) {
                callback(false);
                return;
            }
            if (room.status != GameStatus.play) {
                callback(false);
                return;
            }
            if (room.round % room.players.length != room.players.findIndex(it => it == uuid)) {
                callback(false);
                return;
            }
            room.round += 1;
            room.subRound = 0;
            client.to(roomId).emit("step", room.serial());
            callback(true);
            console.log("fin-round");
        });
    });
}
