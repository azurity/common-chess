const fs = require("node:fs");

let userlist;
let nameSet;

function load() {
    let data = JSON.parse(fs.readFileSync('user.json'));
    userlist = new Map(data);
    nameSet = new Set(data.map(it => it[1]));
}

function save() {
    let data = JSON.stringify(Array.from(userlist, ([key, value]) => [key, value]));
    fs.writeFileSync('user.json', data);
}

const getName = (uuid) => {
    if (!userlist.has(uuid)) {
        return "";
    }
    return userlist.get(uuid);
}

const setName = (uuid, name) => {
    if (nameSet.has(name)) {
        return false;
    }
    nameSet.add(name);
    userlist.set(uuid, name);
    save();
    return true;
}

load();

module.exports = {
    getName,
    setName,
};
