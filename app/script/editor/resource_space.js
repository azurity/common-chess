import { LitElement, html, css, ref, createRef, map, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Package } from '../base/package.js';
import { Board } from '../base/board.js';
import { ResourceType } from '../base/resource.js';

import "../component/popup_box.js";
import "./package_editor.js";
import "./board_editor.js";

const ResourceLogo = new Map([
    [ResourceType.piece, 'chess'],
    [ResourceType.board, 'grid_view'],
]);

class ResourceCard extends LitElement {
    static properties = {
        type: { type: String },
        remote: { type: Boolean },
        titleText: { type: String },
        author: { type: String },
    };

    static styles = css`
    :host {
        width: 232px;
        height: 72px;
        font-size: 16px;
        line-height: 24px;
        grid-template-rows: repeat(3, 24px);
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .title {
        display: flex;
        align-items: center;
        user-select: none;
    }
    .title-icon {
        height: 100%;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .title-button {
        cursor: pointer;
    }
    .title-button:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .text {
        box-sizing: border-box;
        padding: 0 8px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    `;

    onEvent(type) {
        this.dispatchEvent(new CustomEvent(type));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title">
            <div class="title-icon">
                <span class="material-symbols-outlined">${ResourceLogo.get(this.type)}</span>
            </div>
            ${when(this.remote, () => html`
            <div class="title-icon" style="color: gray;">
                <span class="material-symbols-outlined">cloud</span>
            </div>
            <div style="color: gray; flex-grow: 1;">REMOTE</div>
            <div class="title-icon title-button" @click="${() => this.onEvent("download")}">
                <span class="material-symbols-outlined">cloud_download</span>
            </div>
            `, () => html`
            <div class="title-icon" style="color: gray;">
                <span class="material-symbols-outlined">computer</span>
            </div>
            <div style="color: gray; flex-grow: 1;">LOCAL</div>
            <div class="title-icon title-button" @click="${() => this.onEvent("edit")}">
                <span class="material-symbols-outlined">edit</span>
            </div>
            <div class="title-icon title-button" @click="${() => this.onEvent("upload")}">
                <span class="material-symbols-outlined">cloud_upload</span>
            </div>
            `)}
            <div class="title-icon title-button" @click="${() => this.onEvent("delete")}">
                <span class="material-symbols-outlined">close</span>
            </div>
        </div>
        <div class="text" title="${this.titleText}">${this.titleText}</div>
        <div class="text" style="color: gray;" title="${this.author}">${this.author}</div>
        `;
    }
}
customElements.define("resource-card", ResourceCard);

class ResourceSpace extends LitElement {
    static properties = {
        _local: { state: true },
        _remote: { state: true },
    };

    static styles = css`
    :host {
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(auto-fill, 240px);
        grid-auto-rows: 80px;
        grid-gap: 8px;
        justify-content: space-around;
    }
    .add {
        width: 232px;
        height: 72px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        cursor: pointer;
    }
    .add:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .menu {
        min-height: 12px;
        font-size: 16px;
        line-height: 24px;
        background-color: white;
        border: 1px solid rgb(127 127 127 / 0.3);
        max-height: calc(25px * 16 + 1px);
        box-sizing: content-box;
        overflow-y: auto;
    }
    .menu > * {
        padding: 0 8px;
        height: 24px;
        border-bottom: 1px solid rgb(127 127 127 / 0.2);
        user-select: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        overflow: hidden;
    }
    .menu > * > span {
        height: 24px;
        aspect-ratio: 1;
    }
    .menu > :hover {
        background-color: rgb(127 127 127 / 0.3);
    }
    .menu > :last-child {
        border-bottom-color: transparent;
    }
    `;

    constructor() {
        super();
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        this._local = rList.map(it => {
            return {
                type: it.type,
                uuid: it.data.uuid,
                titleText: it.data.name,
                remote: false,
                author: 'ME',
            };
        });
        this.loadRemote();
    }

    resourceMenuRef = createRef();

    packageEditorDialog = createRef();
    packageEditorRef = createRef();

    boardEditorDialog = createRef();
    boardEditorRef = createRef();

    delayTasks = [];

    async loadRemote() {
        let res = await fetch('/resources.json');
        let data = await res.json();
        this._remote = data.map(it => {
            return {
                type: it.type,
                uuid: it.uuid,
                titleText: it.titleText,
                remote: true,
                author: '@' + it.author,
            };
        });
    }

    newPiecePackage() {
        this.resourceMenuRef.value.close();
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        let instance = new Package();
        instance.uuid = UUIDv4();
        rList.push({
            type: ResourceType.piece,
            data: instance.serial(),
        });
        localStorage.setItem("resources", JSON.stringify(rList));
        this._local = rList.map(it => {
            return {
                type: it.type,
                uuid: it.data.uuid,
                titleText: it.data.name,
                remote: false,
                author: 'ME',
            };
        });
    }

    newBoard(type) {
        this.resourceMenuRef.value.close();
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        let info = Board.implDict.get(type);
        let instance = new info.Class();
        instance.uuid = UUIDv4();
        rList.push({
            type: ResourceType.board,
            data: instance.serial(),
        });
        localStorage.setItem("resources", JSON.stringify(rList));
        this._local = rList.map(it => {
            return {
                type: it.type,
                uuid: it.data.uuid,
                titleText: it.data.name,
                remote: false,
                author: 'ME',
            };
        });
    }

    editResource(e) {
        let uuid = e.target.dataset["id"];
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        let item = rList.find(it => it.data.uuid == uuid);
        if (item != undefined) {
            switch (item.type) {
                case ResourceType.piece:
                    this.packageEditorDialog.value.open();
                    this.packageEditorRef.value.setModel(item.data);
                    break;
                case ResourceType.board:
                    this.boardEditorDialog.value.open();
                    this.boardEditorRef.value.setModel(item.data);
                    break;
            }
        }
    }

    async deleteResource(e) {
        let uuid = e.target.dataset["id"];
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        if (rList.find(it => it.data.uuid == uuid) != undefined) {
            rList = rList.filter(it => it.data.uuid != uuid);
            localStorage.setItem("resources", JSON.stringify(rList));
            this._local = rList.map(it => {
                return {
                    type: it.type,
                    uuid: it.data.uuid,
                    titleText: it.data.name,
                    remote: false,
                    author: 'ME',
                };
            });
        } else {
            await fetch(`/resource/${uuid}`, {
                method: 'DELETE',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user: localStorage.getItem("user-uuid"),
                }),
            });
            await this.loadRemote();
        }
    }

    changeResource(e) {
        this.packageEditorDialog.value.close();
        this.boardEditorDialog.value.close();
        let data = e.detail;
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        let item = rList.find(it => it.data.uuid == data.uuid);
        item.data = data;
        localStorage.setItem("resources", JSON.stringify(rList));
        this._local = rList.map(it => {
            return {
                type: it.type,
                uuid: it.data.uuid,
                titleText: it.data.name,
                remote: false,
                author: 'ME',
            };
        });
    }

    async uploadResource(e) {
        let uuid = e.target.dataset["id"];
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        let item = rList.find(it => it.data.uuid == uuid);
        if (item == null) {
            return;
        }
        item.author = localStorage.getItem("user-uuid");
        // TODO: re set uuid of all pieces?
        let res = await fetch('/resource', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
        let sid = (await res.json()).uuid;
        await this.loadRemote();
    }

    async downloadResource(e) {
        let uuid = e.target.dataset["id"];
        let res = await fetch(`/resource/${uuid}`);
        let item = await res.json();
        item.author = undefined;
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        switch (item.type) {
            case ResourceType.piece:
                {
                    let instance = new Package();
                    instance.parse(item.data);
                    instance.reID();
                    item.data = instance.serial();
                    break;
                }
            case ResourceType.board:
                {
                    let info = Board.implDict.get(item.data.type);
                    let instance = new info.Class();
                    instance.parse(item.data);
                    instance.reID();
                    item.data = instance.serial();
                    break;
                }
        }
        rList.push(item);
        localStorage.setItem("resources", JSON.stringify(rList));
        this._local = rList.map(it => {
            return {
                type: it.type,
                uuid: it.data.uuid,
                titleText: it.data.name,
                remote: false,
                author: 'ME',
            };
        });
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div style="position: relative;">
            <div class="add" @click="${() => { this.resourceMenuRef.value.open(); }}">
                <span class="material-symbols-outlined">add</span>
            </div>
            <div style="position: absolute; left: 0; width: 100%;">
                <popup-box ${ref(this.resourceMenuRef)} local fitWidth>
                    <div class="menu">
                        <div @click="${this.newPiecePackage}"><span class="material-symbols-outlined">chess</span>piece package</div>
                        ${map(Board.implDict.keys(), it => html`
                        <div @click="${() => this.newBoard(it)}"><span class="material-symbols-outlined">grid_view</span>${it}</div>
                        `)}
                    </div>
                </popup-box>
            </div>
        </div>
        ${map(this._local, it => html`
        <resource-card data-id="${it.uuid}" type="${it.type}" ?remote="${it.remote}" titleText="${it.titleText}" author="${it.author}" @edit="${this.editResource}" @delete="${this.deleteResource}" @upload="${this.uploadResource}"></resource-card>
        `)}
        ${map(this._remote, it => html`
        <resource-card data-id="${it.uuid}" type="${it.type}" ?remote="${it.remote}" titleText="${it.titleText}" author="${it.author}" @delete="${this.deleteResource}" @download="${this.downloadResource}"></resource-card>
        `)}
        <popup-box ${ref(this.packageEditorDialog)} backdrop hold>
            <package-editor ${ref(this.packageEditorRef)} @submit="${this.changeResource}" @cancel="${() => { this.packageEditorDialog.value.close(); }}"></package-editor>
        </popup-box>
        <popup-box ${ref(this.boardEditorDialog)} backdrop hold>
            <board-editor ${ref(this.boardEditorRef)} @submit="${this.changeResource}" @cancel="${() => { this.boardEditorDialog.value.close(); }}"></board-editor>
        </popup-box>
        `;
    }

    updated() {
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
    }
}
customElements.define("resource-space", ResourceSpace);
