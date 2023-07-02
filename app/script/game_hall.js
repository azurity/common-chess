import { LitElement, html, css, ref, createRef, map } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { ResourceType } from './base/resource.js';
import socket from './socket.js';

import "./game_table.js";
import { Board } from './base/board.js';

class GameTableCard extends LitElement {
    static properties = {
        titleText: { type: String },
        players: { type: String },
        total: { type: String },
    };

    static styles = css`
    :host {
        width: 240px;
        height: 168px;
        font-size: 16px;
        line-height: 20px;
        grid-template-rows: 24px 120px 24px;
        /* border: 4px dashed rgb(127 127 127 / 0.4); */
    }
    .title {
        padding-left: 8px;
        height: 20px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        border-bottom: none;
        display: flex;
        align-items: center;
    }
    .title-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .title-button {
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .title-button:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .info {
        padding: 0 8px;
        height: 20px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        border-top: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        user-select: none;
    }
    .card-pic {
        position: relative;
        display: flex;
        justify-content: center;
        user-select: none;
    }
    .card-pic::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    `;

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title">
            <span style="flex-grow: 1;">${this.titleText}</span>
            <div class="title-button" @click="${() => { this.dispatchEvent(new CustomEvent("enter")); }}">
                <span class="material-symbols-outlined">login</span>
            </div>
        </div>
        <div class="card-pic">
            <span style="font-size: 120px;" class="material-symbols-outlined">table_bar</span>
        </div>
        <div class="info">
            <span style="color: gray;">players</span>
            <span>${this.players}</span>
            <span style="color: gray;">/</span>
            <span>${this.total}</span>
        </div>
        `;
    }
}
customElements.define("game-table-card", GameTableCard);

class GameHall extends LitElement {
    static properties = {
        _boards: { state: true },
        _rooms: { state: true },
    };

    static styles = css`
    :host {
        width: 100%;
        height: 100%;
        overflow-x: hidden;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(auto-fill, 240px);
        grid-auto-rows: 168px;
        grid-gap: 8px;
        justify-content: space-around;
    }
    .add {
        width: 232px;
        height: 160px;
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
    .menu > :hover {
        background-color: rgb(127 127 127 / 0.3);
    }
    .menu > :last-child {
        border-bottom-color: transparent;
    }
    `;

    constructor() {
        super();
        this.loadBoards().then(() => {
            this.loadRoomInfo();
            this.loadRooms();
        });
    }

    boardMenuRef = createRef();

    gameTableDialog = createRef();
    gameTableRef = createRef();

    async loadBoards() {
        let res = await fetch('/resources.json');
        let data = await res.json();
        this._boards = data.filter(it => it.type == ResourceType.board).filter(it => it.N > 0).map(it => {
            return {
                uuid: it.uuid,
                titleText: it.titleText,
                N: it.N,
            };
        });
    }

    async loadRoomInfo() {
        let info = await new Promise((resolve) => {
            socket.emit("room-info", resolve);
        });
        if (info != null) {
            // already in a room
            this.gameTableDialog.value.open();
            this.gameTableRef.value.open();

            let res = await fetch(`/resource/${info.type}`);
            let board = await res.json();
            let boardBase = Board.implDict.get(board.data.type);
            let instance = new boardBase.Class();
            instance.parse(board.data);
            this.gameTableRef.value.setModel(instance);
            setTimeout(() => {
                this.gameTableRef.value.setRoomInfo(info, info.round);
            }, 0);
        }
    }

    async loadRooms() {
        this._rooms = await new Promise((resolve) => {
            socket.emit("room-list", resolve);
        }) ?? [];
    }

    async newGame(board) {
        this.boardMenuRef.value.close();
        let room = await new Promise((resolve) => {
            socket.emit("new-room", board.uuid, resolve);
        });
        if (room != "") {
            await this.loadRooms();
            await this.joinRoom(room);
        }
    }

    async enterRoom(e) {
        let rid = e.target.dataset["id"];
        await this.joinRoom(rid);
    }

    async joinRoom(rid) {
        this.gameTableDialog.value.open();
        this.gameTableRef.value.open();
        if (await new Promise((resolve) => {
            socket.emit("join", rid, resolve);
        })) {
            let info = this._rooms.find(it => it.uuid == rid);

            let res = await fetch(`/resource/${info.type}`);
            let board = await res.json();
            let boardBase = Board.implDict.get(board.data.type);
            let instance = new boardBase.Class();
            instance.parse(board.data);
            this.gameTableRef.value.setModel(instance);
        } else {
            this.gameTableRef.value.close();
            this.gameTableDialog.value.close();
        }
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div style="position: relative;">
            <div class="add" @click="${() => { this.boardMenuRef.value.open(); }}">
                <span class="material-symbols-outlined">add</span>
            </div>
            <div style="position: absolute; left: 0; width: 100%;">
                <popup-box ${ref(this.boardMenuRef)} local fitWidth>
                    <div class="menu">
                    ${map(this._boards, it => html`
                    <div @click="${() => this.newGame(it)}">${it.titleText}</div>
                    `)}
                    </div>
                </popup-box>
            </div>
        </div>
        ${map(this._rooms, it => html`
        <game-table-card data-id="${it.uuid}" titleText="${this._boards.find(b => b.uuid == it.type)?.name ?? ''}" players="${it.players.length}" total="${it.N}" @enter="${this.enterRoom}"></game-table-card>
        `)}
        <popup-box ${ref(this.gameTableDialog)} hold>
            <game-table ${ref(this.gameTableRef)} @exit="${() => { this.gameTableDialog.value.close(); this.loadRooms(); }}"></game-table>
        </popup-box>
        `;
    }
}
customElements.define("game-hall", GameHall);
