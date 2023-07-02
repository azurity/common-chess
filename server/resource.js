const fs = require("node:fs");
const path = require('node:path');

resources = new Map();

function load() {
    for (let it of fs.readdirSync('resources')) {
        let filename = `resources/${it}`;
        if (path.extname(filename) != ".json") {
            console;
        }
        let item = JSON.parse(fs.readFileSync(filename));
        resources.set(item.data.uuid, {
            type: item.type,
            author: item.author,
            uuid: item.data.uuid,
            titleText: item.data.name,
            N: item.data.players != undefined ? item.data.players.length : undefined,
        });
    }
}
load();

const addResource = (item) => {
    fs.writeFileSync(`resources/${item.data.uuid}.json`, JSON.stringify(item));
    resources.set(item.data.uuid, {
        type: item.type,
        author: item.author,
        uuid: item.data.uuid,
        titleText: item.data.name,
        N: item.data.players != undefined ? item.data.players.length : undefined,
    });
}

const delResource = (uuid) => {
    if (resources.get(uuid) != undefined) {
        fs.unlinkSync(`resources/${uuid}.json`);
        resources.delete(uuid);
    }
}

const getResource = (uuid) => {
    let filename = `resources/${uuid}.json`;
    if (fs.existsSync(filename)) {
        return JSON.parse(fs.readFileSync(filename));
    }
    return null;
}

const getAll = () => {
    return Array.from(resources, ([_, value]) => value);
}

module.exports = {
    addResource,
    delResource,
    getResource,
    getAll,
}
