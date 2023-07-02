import { LitElement, html, css, ref, createRef, when, map, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Board } from '../base/board.js';
import { Player } from '../base/player.js';
import { Nation } from '../base/nation.js';
import { ResourceType } from '../base/resource.js';
import { Package } from '../base/package.js';
import { Entity } from '../base/entity.js';

class BoardTreeNode extends LitElement {
    static properties = {
        group: { type: Boolean },
        titleText: { type: String },
        logo: { type: String },
        _expand: { state: true },
    };

    static styles = css`
    :host {
        width: 100%;
    }
    .title-bar {
        grid-column: 1 / span 2;
        height: 24px;
        font-size: 16px;
        line-height: 24px;
        display: flex;
    }
    .logo {
        height: 100%;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
    }
    .title-text {
        flex-grow: 1;
        padding-left: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .title-button,
    .title-bar > ::slotted(*) {
        height: 100%;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .title-button:hover,
    .title-bar > ::slotted(:hover) {
        background-color: rgb(127 127 127 / 0.2);
    }
    .expand-body {
        width: calc(100% - 16px);
        margin-left: 11px;
        border-left: 1px solid rgb(127 127 127 / 0.2);
        overflow: hidden;
        padding-left: 4px;
    }
    `;

    constructor() {
        super();
        this._expand = true;
    }

    toggleExpand() {
        this._expand = !this._expand;
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title-bar">
            ${when(this.group, () => html`
            <div class="title-button" @click="${this.toggleExpand}">
                <span class="material-symbols-outlined">${this._expand ? 'expand_less' : 'expand_more'}</span>
            </div>
            `, () => when(this.logo.substr(0, 4) == "data:", () => html`
            <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 64 64" class="logo">
                <use href="${this.logo}" width="64" height="64" />
            </svg>
            `, () => html`
            <div class="logo">
                <span class="material-symbols-outlined">${this.logo}</span>
            </div>
            `))}
            <div class="title-text">${this.titleText}</div>
            <slot name="action"></slot>
        </div>
        <div class="expand-body" style="height: ${this._expand ? 'auto' : '0'};">
            <slot></slot>
        </div>
        `;
    }
}
customElements.define("board-tree-node", BoardTreeNode);

class BoardEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _name: { state: true },
        _nameEdit: { state: true },
        // _localPackages: { state: true },
        _remotePackages: { state: true },
        _colormap: { state: true },
    };

    static styles = css`
    :host {
        background-color: white;
        box-sizing: border-box;
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-columns: 328px calc(100% - 328px - 8px);
        grid-template-rows: 32px calc(100% - 40px);
        grid-gap: 8px;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .title-bar {
        grid-column: 1 / span 2;
        height: 32px;
        font-size: 20px;
        line-height: 32px;
        display: flex;
    }
    .title-button {
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .title-button:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .tree-title {
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        height: 32px;
        line-height: 24px;
        font-size: 20px;
        padding-left: 8px;
        display: flex;
    }
    .tree-container {
        background-color: rgb(127 127 127 / 0.1);
        height: calc(100% - 32px);
        overflow-x: hidden;
        overflow-y: scroll;
    }
    .menu {
        min-height: 12px;
        font-size: 16px;
        line-height: 24px;
        width: 160px;
        background-color: white;
        border: 1px solid rgb(127 127 127 / 0.3);
        max-height: calc(25px * 16 + 1px);
        box-sizing: content-box;
        overflow-y: auto;
    }
    .menu .item {
        height: 24px;
        border-bottom: 1px solid rgb(127 127 127 / 0.2);
        user-select: none;
        cursor: pointer;
    }
    .menu .item:hover {
        background-color: rgb(127 127 127 / 0.3);
    }
    .menu .item:last-child {
        border-bottom-color: transparent;
    }
    .menu details > :not(summary) {
        background-color: rgb(127 127 127 / 0.2);
    }
    .menu details:not(:last-child) .item {
        border-bottom-color: rgb(127 127 127 / 0.2);
    }
    summary {
        display: block;
        outline: none;
    }
    .color-button {
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .color-button > * {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    `;

    constructor() {
        super();
        this._model = new Board();
        this._name = "";
        this._nameEdit = false;
        // this._localPackages = [];
        this._remotePackages = [];
        this._colormap = [];
    }

    refreshPieces() {
        let rList = JSON.parse(localStorage.getItem("resources")) ?? [];
        // this._localPackages = rList.filter(it => it.type == ResourceType.piece).map(it => {
        //     let instance = new Package();
        //     instance.parse(it.data);
        //     return instance;
        // });
        this.loadRemotePieces();
    }

    async loadRemotePieces() {
        let res = await fetch('/resources.json');
        let data = await res.json();
        this._remotePackages = await Promise.all(data.filter(it => it.type == ResourceType.piece).map(async it => {
            let res = await fetch(`/resource/${it.uuid}`);
            let item = await res.json();
            let instance = new Package();
            instance.parse(item.data);
            return instance;
        }));
    }

    setModel(data) {
        let info = Board.implDict.get(data.type);
        let instance = new info.Class();
        instance.parse(data);
        this._model = instance;
        this._name = this._model.name;
        this._nameEdit = false;
        this._colormap = [...info.colormap];
        this.delayTasks.push(() => {
            this.boardEditor.value.setModel(this._model);
        });
        this.refreshPieces();
    }

    nameEditor = createRef();
    topMenuRef = createRef();
    subMenuRefs = {};

    boardEditor = createRef();

    delayTasks = [];

    onsubmit() {
        this.dispatchEvent(new CustomEvent("submit", { detail: this._model.serial() }));
    }

    oncancel() {
        this.dispatchEvent(new CustomEvent("cancel", {}));
    }

    changeName(e) {
        this._model.name = e.detail;
        this._name = this._model.name;
    }

    editName() {
        this._nameEdit = true;
        this.nameEditor.value.focus();
    }

    addPlayer() {
        this.topMenuRef.value.close();
        let instance = new Player();
        instance.uuid = UUIDv4();
        this._model.players.push(instance);
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    removePlayer(e) {
        let index = parseInt(e.currentTarget.parentElement.dataset["id"].split(':')[1]);
        this._model.players.splice(index, 1);
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    addNation(e) {
        let uuid = e.currentTarget.parentElement.dataset["id"];
        let instance = new Nation();
        instance.uuid = UUIDv4();
        if (uuid == "") {
            this.topMenuRef.value.close();
            this._model.nations.push(instance);
        }
        else {
            this.subMenuRefs[uuid].value.close();
            let queue = [...this._model.nations];
            while (queue.length > 0) {
                if (queue[0].uuid == uuid) {
                    queue[0].sub.push(instance);
                    break;
                }
                queue.push(...queue[0].sub);
                queue = queue.slice(1);
            }
        }
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    removeNation(e) {
        let uuid = e.currentTarget.dataset["id"];
        let queue = [this._model.nations];
        while (queue.length > 0) {
            let index = queue[0].findIndex(it => it.uuid == uuid);
            if (index >= 0) {
                queue[0].splice(index, 1);
                break;
            }
            queue.push(...queue[0].filter(it => it instanceof Nation).map(it => it.sub));
            queue = queue.slice(1);
        }
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    addPiece(parent, entity) {
        this.subMenuRefs[parent.uuid].value.close();
        let instance = new Entity();
        instance.parse(entity.serial());
        instance.type = instance.uuid;
        instance.uuid = UUIDv4();
        this._model.pieces.push(instance);

        parent.sub.push(instance);
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    removePiece(e) {
        let uuid = e.currentTarget.dataset["id"];
        this._model.pieces = this._model.pieces.filter(it => it.uuid != uuid);

        let queue = [this._model.nations];
        while (queue.length > 0) {
            let index = queue[0].findIndex(it => it.uuid == uuid);
            if (index >= 0) {
                queue[0].splice(index, 1);
                break;
            }
            queue.push(...queue[0].filter(it => it instanceof Nation).map(it => it.sub));
            queue = queue.slice(1);
        }
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    toggleColor(e) {
        let uuid = e.currentTarget.dataset["id"];
        let queue = [...this._model.nations];
        while (queue.length > 0) {
            if (queue[0].uuid == uuid) {
                let newColor = queue[0].color + 1;
                if (newColor >= this._colormap.length) {
                    newColor = -1;
                }
                queue[0].color = newColor;
                break;
            }
            queue.push(...queue[0].sub);
            queue = queue.slice(1);
        }
        this.requestUpdate();
        this.boardEditor.value.requestUpdate();
    }

    render() {
        const renderGroup = (list) => html`
        ${map(list, it => when(it instanceof Nation, () => {
            if (this.subMenuRefs[it.uuid] == undefined) {
                this.subMenuRefs[it.uuid] = createRef();
            }
            return html`
            <board-tree-node titleText="${it.name}" group>
                <div slot="action" data-id="${it.uuid}" @click="${this.toggleColor}">
                    <div class="color-button">
                        ${when(it.color >= 0, () => html`
                        <div title="color" style="background-color: ${this._colormap[it.color]};"></div>
                        `, () => html`
                        <div title="no color">u</div>
                        `)}
                    </div>
                </div>
                <div slot="action">
                    <div style="height: 100%;" @click="${() => { this.subMenuRefs[it.uuid].value.open(); }}">
                        <span class="material-symbols-outlined">add</span>
                    </div>
                    <div style="position: relative;">
                        <popup-box ${ref(this.subMenuRefs[it.uuid])} local>
                            <div data-id="${it.uuid}" class="menu">
                                ${map(this._remotePackages, pack => html`
                                <details>
                                    <summary class="item" style="display: flex;">
                                        <div class="title-button">
                                            <span class="material-symbols-outlined">cloud</span>
                                        </div>
                                        ${pack.name}
                                    </summary>
                                    ${map(pack.entities, piece => html`
                                    <div class="item" @click="${() => this.addPiece(it, piece)}">${piece.name}</div>
                                    `)}
                                </details>
                                `)}
                                <div class="item" @click="${this.addNation}">group</div>
                            </div>
                        </popup-box>
                    </div>
                </div>
                <div slot="action" data-id="${it.uuid}" @click="${this.removeNation}">
                    <span class="material-symbols-outlined">delete</span>
                </div>
                ${renderGroup(it.sub)}
            </board-tree-node>
            `;
        }, () => html`
        <board-tree-node titleText="${it.name}" logo="chess">
            <div slot="action" data-id="${it.uuid}" @click="${this.removePiece}">
                <span class="material-symbols-outlined">delete</span>
            </div>
        </board-tree-node>
        `))}
        `;

        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title-bar">
            <div style="width: 320px; padding-left: 8px;">
                <input-box value="${this._name}" ${ref(this.nameEditor)} ?disabled="${!this._nameEdit}" @change="${this.changeName}" @blur="${() => { this._nameEdit = false; }}">
                    <div slot="prepend-inner" style="height: 100%; aspect-ratio: 1;" @click="${this.editName}">
                        <span class="material-symbols-outlined">edit</span>
                    </div>
                </input-box>
            </div>
            <div style="flex-grow: 1;"></div>
            <div class="title-button" @click="${this.onsubmit}">
                <span class="material-symbols-outlined">done</span>
            </div>
            <div class="title-button" @click="${this.oncancel}">
                <span class="material-symbols-outlined">close</span>
            </div>
        </div>
        <div style="margin-left: 8px; margin-bottom: 8px;">
            <div class="tree-title">
                <div style="flex-grow: 1;">items</div>
                <div class="title-button" @click="${() => { this.topMenuRef.value.open(); }}">
                    <span class="material-symbols-outlined">add</span>
                </div>
                <div style="position: relative;">
                    <popup-box ${ref(this.topMenuRef)} local>
                        <div data-id="" class="menu">
                            <div class="item" @click="${this.addPlayer}">player</div>
                            <div class="item" @click="${this.addNation}">group</div>
                        </div>
                    </popup-box>
                </div>
            </div>
            <div class="tree-container">
                ${map(this._model.players, (it, index) => html`
                    <board-tree-node data-id="player:${index}" titleText="player ${index}" logo="stadia_controller">
                        <div slot="action" @click="${this.removePlayer}">
                            <span class="material-symbols-outlined">delete</span>
                        </div>
                    </board-tree-node>
                `)}
                ${renderGroup(this._model.nations)}
            </div>
        </div>
        <div style="margin-right: 8px; margin-bottom: 8px;">
        ${when(this._model.type == "", () => nothing, () => Board.implDict.get(this._model.type).editor(ref(this.boardEditor)))}
        </div>
        `;
    }

    updated() {
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
    }
}
customElements.define("board-editor", BoardEditor);
