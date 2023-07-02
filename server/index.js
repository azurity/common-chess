const fs = require('node:fs');
const http = require('node:http');
const express = require('express');
// const bodyParser = require('body-parser');
const UUID = require('uuid');
const UserMan = require('./user');
const ResourceMan = require('./resource');
const socket = require('./socket');

const app = express();
app.use(express.json());

app.use(express.static('../app'));

function initMods() {
    let mods = fs.readdirSync('../app/mods')
        .filter(it => fs.statSync(`../app/mods/${it}`).isDirectory())
        .filter(it => fs.existsSync(`../app/mods/${it}/index.js`))
        .filter(it => fs.existsSync(`../app/mods/${it}/desc.json`));
    let descriptions = new Map(mods.map(it => [it, JSON.parse(fs.readFileSync(`../app/mods/${it}/desc.json`, { encoding: 'utf-8' }))]));

    // check dependencies
    while (true) {
        let remove = [];
        for (let it of descriptions.keys()) {
            let unknown = descriptions.get(it).dependencies.filter(it => descriptions.has(it));
            if (unknown.length > 0) {
                console.warn('mods missing dependencies', it, unknown);
                remove.push(it);
            }
        }
        if (remove.length == 0) {
            break;
        }
        for (let it of remove) {
            descriptions.delete(it);
        }
    }

    // sort mods
    let sortedMods = [];
    while (descriptions.size > 0) {
        let count = 0;
        for (let k of descriptions.keys()) {
            if (descriptions.get(k).dependencies.length == 0) {
                count += 1;
                sortedMods.push(k);
                descriptions.delete(k);
                for (let it of descriptions) {
                    it.dependencies = it.dependencies.filter(m => m != k);
                }
            }
        }
        if (count == 0) {
            console.warn("mods circular dependency", unsortedMods.keys());
            break;
        }
    }

    let imports = sortedMods.map(it => `import "./mods/${it}/index.js";`);
    return imports.join('\n');
}
let modJS = initMods();

app.get('/mods.js', (req, res) => {
    res.contentType('text/javascript').send(modJS);
});

app.get('/reload-mods', (req, res) => {
    modJS = initMods();
    res.sendStatus(200);
});

app.get('/name/:uuid', (req, res) => {
    let uuid = req.params.uuid;
    res.json(UserMan.getName(uuid));
});

app.post('/rename', (req, res) => {
    let uuid = req.body.uuid;
    let name = req.body.name;
    if (uuid == "" || name == "") {
        res.sendStatus(403);
        return;
    }
    if (!UserMan.setName(uuid, name)) {
        res.sendStatus(403);
        return;
    }
    res.sendStatus(200);
});

app.get('/resources.json', (req, res) => {
    let data = ResourceMan.getAll().map(it => ({
        type: it.type,
        uuid: it.uuid,
        titleText: it.titleText,
        N: it.N,
        author: UserMan.getName(it.author),
    }));
    res.json(data);
});

app.get('/resource/:uuid', (req, res) => {
    let data = ResourceMan.getResource(req.params.uuid);
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    res.json(data);
});

app.delete('/resource/:uuid', (req, res) => {
    let rid = req.params.uuid;
    let uid = req.body.user ?? "";
    if (ResourceMan.getResource(rid)?.author == uid) {
        ResourceMan.delResource(rid);
    }
    res.sendStatus(200);
});

app.post('/resource', (req, res) => {
    let data = req.body;
    let uuid = UUID.v4();
    data.data.uuid = uuid;
    if (data.author == "") {
        res.sendStatus(403);
        return;
    }
    ResourceMan.addResource(data);
    res.json(uuid);
});

const server = http.createServer(app);
socket(server);

server.listen(8080);
