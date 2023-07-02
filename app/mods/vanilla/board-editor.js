import { LitElement, html, css, ref, createRef, when, map, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { Board } from "../../script/base/board.js";
import { FormItemNumberExtra } from '../../script/base/action.js';
import { Entity } from '../../script/base/entity.js';

class ModVanillaBasicBoardEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _cols: { state: true },
        _rows: { state: true },
        _select: { state: true },
    };

    static styles = css`
    :host {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: calc(100% - 150px) 150px;
        grid-template-rows: calc(100% - 120px) 120px;
    }
    .board-container {
        width: calc(100% - 16px);
        margin: 8px;
    }
    .board {
        width: 100%;
        display: grid;
        align-items: center;
        justify-content: center;
        grid-template-columns: auto auto auto;
        grid-template-rows: auto auto auto;
    }
    .board-player {
        display: grid;
        align-items: center;
        justify-items: center;
        width: 100%;
        height: 100%;
    }
    .board-player.left,
    .board-player.right {
        grid-template-columns: 64px 64px;
    }
    .board-player.top,
    .board-player.bottom {
        grid-template-rows: 64px 64px;
    }
    .board-player > .player-slot {
        width: 64px;
        height: 64px;
    }
    .board-player.left > .nation-slot,
    .board-player.right > .nation-slot {
        width: 64px;
        min-height: 192px;
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .board-player.top > .nation-slot,
    .board-player.bottom > .nation-slot {
        min-width: 192px;
        height: 64px;
        width: 100%;
        display: flex;
        flex-direction: row;
    }
    .player-slot {
        width: 64px;
        height: 64px;
    }
    .player-slot > .placement {
        width: 64px;
        height: 64px;
        border-radius: 32px;
        box-sizing: border-box;
        border: 2px dashed gray;
        color: gray;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        cursor: pointer;
    }
    .nation-slot {
        width: 100%;
        height: 100%;
        position: relative;
    }
    .nation-slot::before {
        position: absolute;
        content: '';
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .piece-box {
        grid-row: 1 / span 2;
        grid-column: 2 / span 1;
        border-left: 4px dashed rgb(127 127 127 / 0.4);
        height: 100%;
    }
    .piece-box-body {
        height: calc(100% - 24px);
        overflow-x: hidden;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: 64px 64px;
        grid-auto-rows: 64px;
        justify-content: space-around;
    }
    .player-box {
        border-top: 4px dashed rgb(127 127 127 / 0.4);
        width: 100%;
    }
    .player-box-body {
        width: 100%;
        height: calc(100% - 24px);
        overflow-x: scroll;
        display: flex;
        align-items: center;
    }
    .title {
        height: 24px;
        font-size: 16px;
        line-height: 24px;
        color: gray;
    }
    .item {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        cursor: pointer;
        border: 4px dashed transparent;
        position: relative;
        box-sizing: border-box;
    }
    .player-slot:not(:has(.placement)):hover,
    .player-slot > .placement:hover,
    .item:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .king {
        width: 40px;
        height: 40px;
        border-radius: 16px;
        border: 4px dashed lightgray;
    }
    .board-body {
        display: flex;
        flex-direction: column;
        border: 4px dashed lightgray;
    }
    .board-body > * {
        display: flex;
        flex-direction: row;
    }
    .board-body > :nth-child(2n) > :nth-child(2n),
    .board-body > :nth-child(2n + 1) > :nth-child(2n + 1) {
        background-color: white;
    }
    .board-body > :nth-child(2n + 1) > :nth-child(2n),
    .board-body > :nth-child(2n) > :nth-child(2n + 1) {
        background-color: lightgray;
    }
    .item.select {
        border: 4px solid gray;
    }
    .board-body .item::before {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        border: 4px dashed transparent;
    }
    .board-body .item:hover::before {
        border-color: #FFD700;
    }
    `;

    constructor() {
        super();
        this._model = null;
        this.rangeMeta.min = 3;
        this._select = "";
    }

    setModel(model) {
        this._model = model;
        this._cols = this._model.size[0];
        this._rows = this._model.size[1];
        this.delayTasks.push(() => {
            this.rowsRef.value.reset(this.rangeMeta, this._rows);
            this.colsRef.value.reset(this.rangeMeta, this._cols);
        });
    }

    rangeMeta = new FormItemNumberExtra();

    rowsRef = createRef();
    colsRef = createRef();

    delayTasks = [];

    setRows(e) {
        this._rows = e.detail;
        this._model.size[1] = this._rows;
        this.filterPieces();
    }

    setCols(e) {
        this._cols = e.detail;
        this._model.size[0] = this._cols;
        this.filterPieces();
    }

    filterPieces() {
        this._model.state = this._model.state.filter(it => it[0] < this._cols && it[1] < this._rows);
    }

    setPlayerDirect(direct) {
        let player = this._model.players.find(it => it.uuid == this._select);
        if (player == undefined) {
            return;
        }
        player.direct = direct;
        this._select = "";
    }

    setNationOwner(ownerIndex) {
        if (ownerIndex < 0) {
            return;
        }
        let nation = this._model.nations.find(it => it.uuid == this._select);
        if (nation == undefined) {
            return;
        }
        nation.monarch = this._model.players[ownerIndex].uuid;
        this._select = "";
    }

    setPiecePosition(position) {
        if (this._model.pieces.find(it => it.uuid == this._select) == undefined) {
            return;
        }
        let index = this._model.state.findIndex(it => it[0] == this._select);
        if (index < 0) {
            index = this._model.state.length;
            this._model.state.push([this._select, [0, 0]]);
        }
        if (position == null) {
            this._model.state.splice(index, 1);
        } else {
            this._model.state[index][1] = position;
        }
        this._select = "";
    }

    render() {
        let playerTop = this._model.players.findIndex(it => it.direct == 3);
        let playerLeft = this._model.players.findIndex(it => it.direct == 4);
        let playerRight = this._model.players.findIndex(it => it.direct == 2);
        let playerBottom = this._model.players.findIndex(it => it.direct == 1);
        let pieceColorIndex = [];
        for (let it of this._model.nations) {
            if (it.color >= 0) {
                let queue = [...it.sub];
                while (queue.length > 0) {
                    if (queue[0] instanceof Entity) {
                        pieceColorIndex.push([queue[0].uuid, it.color]);
                    } else {
                        queue.push(queue[0].sub);
                    }
                    queue = queue.slice(1);
                }
            }
        }
        let pieceColor = new Map();
        let boardInfo = Board.implDict.get(this._model.type);
        for (let p of this._model.pieces) {
            let info = pieceColorIndex.find(it => it[0] == p.uuid) ?? ["", -1];
            pieceColor.set(p.uuid, info[1] < 0 ? 'transparent' : boardInfo.colormap[info[1]]);
        }
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div style="overflow: auto;">
            <div style="color: gray;">rows</div>
            <number-form-item-editor ${ref(this.rowsRef)} @change="${this.setRows}"></number-form-item-editor>
            <div style="color: gray;">cols</div>
            <number-form-item-editor ${ref(this.colsRef)} @change="${this.setCols}"></number-form-item-editor>
            <div class="board-container">
                <div class="board">
                    <div class="board-player top" style="grid-area: 1 / 2 / 2 / 3;">
                        <div class="nation-slot">
                            ${when(playerTop >= 0, () => map(this._model.nations.filter(it => it.color >= 0 && it.monarch == this._model.players[playerTop].uuid), nation => html`
                            <div class="item ${nation.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = nation.uuid; }}">
                                <div class="king" style="background-color: ${Board.implDict.get(this._model.type).colormap[nation.color]};"></div>
                            </div>
                            `), () => nothing)}
                            <div class="item" @click="${() => this.setNationOwner(playerTop)}">
                                <span class="material-symbols-outlined">input</span>
                            </div>
                        </div>
                        <div class="player-slot">
                            ${when(playerTop >= 0, () => {
            let player = this._model.players[playerTop];
            return html`
                            <div title="player ${playerTop + 1}" class="item ${player.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = player.uuid; }}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">person</span>
                            </div>
                            `;
        }, () => html`
                            <div class="placement" @click="${() => this.setPlayerDirect(3)}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">keyboard_arrow_down</span>
                            </div>
                            `)}
                        </div>
                    </div>
                    <div class="board-player left" style="grid-area: 2 / 1 / 3 / 2;">
                        <div class="nation-slot">
                            ${when(playerLeft >= 0, () => map(this._model.nations.filter(it => it.color >= 0 && it.monarch == this._model.players[playerLeft].uuid), nation => html`
                            <div class="item ${nation.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = nation.uuid; }}">
                                <div class="king" style="background-color: ${Board.implDict.get(this._model.type).colormap[nation.color]};"></div>
                            </div>
                            `), () => nothing)}
                            <div class="item" @click="${() => this.setNationOwner(playerLeft)}">
                                <span class="material-symbols-outlined">input</span>
                            </div>
                        </div>
                        <div class="player-slot">
                            ${when(playerLeft >= 0, () => {
            let player = this._model.players[playerLeft];
            return html`
                            <div title="player ${playerLeft + 1}" class="item ${player.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = player.uuid; }}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">person</span>
                            </div>
                            `;
        }, () => html`
                            <div class="placement" @click="${() => this.setPlayerDirect(4)}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">keyboard_arrow_right</span>
                            </div>
                            `)}
                        </div>
                    </div>
                    <div class="board-player right" style="grid-area: 2 / 3 / 3 / 4;">
                        <div class="player-slot">
                            ${when(playerRight >= 0, () => {
            let player = this._model.players[playerRight];
            return html`
                            <div title="player ${playerRight + 1}" class="item ${player.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = player.uuid; }}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">person</span>
                            </div>
                            `;
        }, () => html`
                            <div class="placement" @click="${() => this.setPlayerDirect(2)}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">keyboard_arrow_left</span>
                            </div>
                            `)}
                        </div>
                        <div class="nation-slot">
                            ${when(playerRight >= 0, () => map(this._model.nations.filter(it => it.color >= 0 && it.monarch == this._model.players[playerRight].uuid), nation => html`
                            <div class="item ${nation.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = nation.uuid; }}">
                                <div class="king" style="background-color: ${Board.implDict.get(this._model.type).colormap[nation.color]};"></div>
                            </div>
                            `), () => nothing)}
                            <div class="item" @click="${() => this.setNationOwner(playerRight)}">
                                <span class="material-symbols-outlined">input</span>
                            </div>
                        </div>
                    </div>
                    <div class="board-player bottom" style="grid-area: 3 / 2 / 4 / 3;">
                        <div class="player-slot">
                            ${when(playerBottom >= 0, () => {
            let player = this._model.players[playerBottom];
            return html`
                            <div title="player ${playerBottom + 1}" class="item ${player.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = player.uuid; }}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">person</span>
                            </div>
                            `;
        }, () => html`
                            <div class="placement" @click="${() => this.setPlayerDirect(1)}">
                                <span class="material-symbols-outlined" style="font-size: 48px;">keyboard_arrow_up</span>
                            </div>
                            `)}
                        </div>
                        <div class="nation-slot">
                            ${when(playerBottom >= 0, () => map(this._model.nations.filter(it => it.color >= 0 && it.monarch == this._model.players[playerBottom].uuid), nation => html`
                            <div class="item ${nation.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = nation.uuid; }}">
                                <div class="king" style="background-color: ${Board.implDict.get(this._model.type).colormap[nation.color]};"></div>
                            </div>
                            `), () => nothing)}
                            <div class="item" @click="${() => this.setNationOwner(playerBottom)}">
                                <span class="material-symbols-outlined">input</span>
                            </div>
                        </div>
                    </div>
                    <div class="board-body" style="grid-area: 2 / 2 / 3 / 3;">
                    ${map(Array(this._rows).keys(), rawY => html`
                    <div>
                        ${map(Array(this._rows).keys(), rawX => {
            let x = rawX;
            let y = this._rows - rawY - 1;
            let pieceId = this._model.state.find(it => it[1][0] == x && it[1][1] == y) ?? [""];
            let piece = this._model.pieces.find(it => it.uuid == pieceId[0]);
            return when(piece != undefined, () => html`
                            <div data-x="${x}" data-y="${y}" class="item ${piece.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = piece.uuid; }}">
                                ${when(piece.img != "", () => html`
                                <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 64 64" style="color: ${pieceColor.get(piece.uuid)};">
                                    <use href="${piece.img + "#root"}" width="64" height="64" />
                                </svg>
                                `, () => html`
                                <span class="material-symbols-outlined" style="font-size: 48px;">chess</span>
                                `)}
                            </div>
                            `, () => html`
                            <div data-x="${x}" data-y="${y}" class="item" @click="${() => this.setPiecePosition([x, y])}"></div>
                            `);
        })}
                    </div>
                    `)}
                    </div>
                </div>
            </div>
        </div>
        <div class="piece-box">
            <div class="title">piece box</div>
            <div class="piece-box-body">
                ${map(this._model.pieces, piece => when(this._model.state.find(it => it[0] == piece.uuid) == null, () => html`
                <div class="item ${piece.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = piece.uuid; }}">
                    ${when(piece.img != "", () => html`
                    <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 64 64" style="color: ${pieceColor.get(piece.uuid)};">
                        <use href="${piece.img + "#root"}" width="64" height="64" />
                    </svg>
                    `, () => html`
                    <span class="material-symbols-outlined" style="font-size: 48px;">chess</span>
                    `)}
                </div>
                `, () => nothing))}
                <div class="item" @click="${() => this.setPiecePosition(null)}">
                    <span class="material-symbols-outlined">input</span>
                </div>
            </div>
        </div>
        <div class="player-box">
            <div class="title">players & nations</div>
            <div class="player-box-body">
                ${map(this._model.players.filter(it => it.direct == 0), (player, index) => html`
                <div class="item ${player.uuid == this._select ? 'select' : ''}" title="player ${index + 1}" @click="${() => { this._select = player.uuid; }}">
                    <span class="material-symbols-outlined" style="font-size: 48px;">person</span>
                </div>
                `)}
                ${map(this._model.nations.filter(it => it.color >= 0 && it.monarch == ""), nation => html`
                <div class="item ${nation.uuid == this._select ? 'select' : ''}" @click="${() => { this._select = nation.uuid; }}">
                    <div class="king" style="background-color: ${Board.implDict.get(this._model.type).colormap[nation.color]};"></div>
                </div>
                `)}
            </div>
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
customElements.define("mod-vanilla-basic-board-editor", ModVanillaBasicBoardEditor);
