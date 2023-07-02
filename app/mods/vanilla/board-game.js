import { LitElement, html, css, ref, createRef, when, map, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Board } from "../../script/base/board.js";
import { Condition } from '../../script/base/action.js';
import { Entity } from '../../script/base/entity.js';
import { posLocal2Global } from './cond.js';
import { AttackSymbol, CellSymbol, DescInfoAttack, DescInfoMove, DescInfoMoveAttack, PositionSymbol } from './move.js';
import { BehaviourType } from '../../script/base/behaviour.js';
import { LoseSymbol } from './lose.js';
import socket from '../../script/socket.js';

class SelectDesc {
    uuid = NIL_UUID;
    indices = [];
}

class StepDesc {
    states = []; // [[Symbol, ...args]]
    descList = [];
    select = null;
    board = null;
    next = null;
    meta = {};
}

class ModVanillaBasicBoardGame extends LitElement {
    static properties = {
        _model: { state: true },
        _playerNames: { state: true },
        play: { type: Boolean },
        _round: { state: true },
        _subRound: { state: true },
        _select: { state: true },
        _analyzed: { state: true },
        _check: { state: true },
        _availableStep: { state: true },
        _room: { state: true },
        _viewIndex: { state: true },
        _lose: { state: true },
        _win: { state: true },
    };

    static styles = css`
    :host {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 240px calc(100% - 240px);
    }
    .player-bar {
        width: calc(100% - 4px);
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border-right: 4px dashed rgb(127 127 127 / 0.4);
    }
    .player-card {
        display: flex;
        align-items: center;
        height: 24px;
        font-size: 16px;
        line-height: 24px;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        position: relative;
    }
    .player-card > :first-child {
        box-sizing: border-box;
        width: 24px;
        height: 24px;
        margin-right: 8px;
        border: 4px dashed rgb(127 127 127 / 0.8);
    }
    .player-card.round::before {
        width: 100%;
        height: 100%;
        position: absolute;
        box-sizing: border-box;
        border-right: 4px solid rgb(127 127 127 / 0.4);
    }
    .main {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
        cursor: crosshair;
    }
    .lock {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        user-select: none;
        cursor: not-allowed;
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
    .cell {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        /* cursor: pointer; */
        border: 4px solid transparent;
        position: relative;
        box-sizing: border-box;
    }
    .cell::before {
        content: '';
        position: absolute;
        width: 64px;
        height: 64px;
        box-sizing: border-box;
        border: 4px dashed transparent;
    }
    .cell.select {
        border-color: orange;
    }
    .cell.move-aim {
        border-color: green;
    }
    .cell.attack-aim {
        border-color: purple;
    }
    .cell.move-attack-aim {
        border-color: red;
    }
    .cell:hover::before {
        border-color: gray;
    }
    .option-menu-container {
        width: 100vw;
        position: relative;
    }
    .option-menu {
        position: relative;
        width: 10vw;
        left: 90vw;
        box-sizing: border-box;
        border: 4px dashed transparent;
        display: flex;
        flex-direction: column;
        background-color: white;
    }
    .item {
        margin: 8px;
        padding: 8px;
    }
    .item:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .info-layer {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        pointer-events: none;
    }
    `;

    constructor() {
        super();
        this._model = null;
        this._round = 0;
        this._subRound = 0;
        this._select = "";
        this._check = false;
        this._check = false;
        this._availableStep = null;
        this._viewIndex = -1;
    }

    setModel(model) {
        this._model = model;
        this._select = "";
        this._check = false;
        this._lose = false;
        this._availableStep = null;
        this._viewIndex = -1;
        socket.emit("ready");
    }

    setState(roomInfo) {
        this._room = roomInfo;
        if (this._playerNames == undefined) {
            this.loadPlayers(roomInfo.players);
        }
        this._round = roomInfo.round;
        this._subRound = roomInfo.subRound;
        this._model.parse(roomInfo.statusExtra);
        this._model.players.forEach((p, index) => {
            p.user = roomInfo.players[index];
        });
        const myId = localStorage.getItem("user-uuid");
        if (this._model.losers.find(it => it == myId) != undefined) {
            this._lose = true;
            this._check = false;
            const myRound = this._model.players[this._round % this._model.players.length].user == myId;
            if (myRound) {
                socket.emit("fin-round", () => { });
                return;
            }
        }
        this.doAnalyze();
    }

    optionDialog = createRef();

    // Map<uuid, Array<StepDesc(Array<[action-type, ...info]>, behaviour-select-desc, board-state)>>
    analyzeActions(board, imm) {
        let pieceOwner = new Map();
        for (let it of this._model.nations) {
            let monarch = this._model.players.find(p => p.uuid == it.monarch);
            if (monarch != undefined) {
                let queue = [...it.sub];
                while (queue.length > 0) {
                    if (queue[0] instanceof Entity) {
                        pieceOwner.set(queue[0].uuid, monarch);
                    } else {
                        queue.push(queue[0].sub);
                    }
                    queue = queue.slice(1);
                }
            }
        }

        function doBehaviours(piece, behaviourType, board, meta) {
            if (pieceOwner.get(piece.uuid) == undefined) {
                return [];
            }
            let pieceInfo = board.state.find(it => it[0] == piece.uuid);
            if (pieceInfo == null) {
                pieceInfo = [piece.uuid, [Infinity, Infinity]];
                // return [];
            }

            let ret = [];

            for (let behaviour of piece.behaviours) {
                if (behaviour.type != behaviourType) {
                    continue;
                }
                let step = new StepDesc();
                step.states.push([PositionSymbol, [...pieceInfo[1]]], [CellSymbol, [...pieceInfo[1]]]);
                step.select = new SelectDesc();
                step.select.uuid = behaviour.uuid;
                step.meta = JSON.parse(JSON.stringify(meta));

                let boardInfo = Board.implDict.get(board.type);
                step.board = new boardInfo.Class();
                step.board.parse(board.serial());

                let steps = [step];
                let analyzed = [];

                while (steps.length > 0) {
                    let top = steps[0];
                    steps = steps.slice(1);

                    if (top.select.indices.length == behaviour.actions.length) {
                        analyzed.push(top);
                        continue;
                    }

                    let action = behaviour.actions[top.select.indices.length];
                    if (action instanceof Condition) {
                        let newStep = new StepDesc();
                        newStep.states = top.states.map(it => [...it]);
                        newStep.descList = [...top.descList];
                        newStep.select = new SelectDesc();
                        newStep.select.uuid = top.select.uuid;
                        newStep.select.indices = [...top.select.indices, 0];
                        newStep.meta = JSON.parse(JSON.stringify(top.meta));

                        let boardInfo = Board.implDict.get(board.type);
                        newStep.board = new boardInfo.Class();
                        newStep.board.parse(top.board.serial());

                        let ctx = {
                            board: newStep.board,
                            self: piece,
                            attacker: null,
                        };
                        if (top.meta.attack != undefined) {
                            let info = top.meta.attack.find(it => it[1] == piece.uuid);
                            if (info != undefined) {
                                ctx.attacker = newStep.board.pieces.find(it => it.uuid == info[0]) ?? null;
                            }
                        }

                        if (action.fn(ctx)) {
                            steps.push(newStep);
                        }
                    } else {
                        let [newSteps, newDescLists] = action.step(top.board, top.states, piece);

                        if (behaviourType == BehaviourType.Passive && newSteps.length > 1) {
                            continue;
                        }

                        for (let index = 0; index < newSteps.length; index++) {
                            let newStep = new StepDesc();
                            newStep.states = newSteps[index];
                            newStep.descList = [...top.descList, ...newDescLists[index]];
                            newStep.select = new SelectDesc();
                            newStep.select.uuid = top.select.uuid;
                            newStep.select.indices = [...top.select.indices, index];
                            newStep.meta = JSON.parse(JSON.stringify(top.meta));

                            let boardInfo = Board.implDict.get(board.type);
                            newStep.board = new boardInfo.Class();
                            newStep.board.parse(top.board.serial());

                            // update board
                            for (let it of newStep.states) {
                                if (it[0] == PositionSymbol) {
                                    let info = newStep.board.state.find(it => it[0] == piece.uuid);
                                    if (info != undefined) {
                                        info[1] = [...it[1]];
                                    } else if (isFinite(it[1][0]) && isFinite(it[1][1])) {
                                        newStep.board.state.push([piece.uuid, [...it[1]]]);
                                    }
                                } else if (it[0] == AttackSymbol) {
                                    let killed = new Set(it.slice(1));
                                    let killInfo = newStep.board.state.filter(p => killed.has(p[0]));
                                    newStep.board.state = newStep.board.state.filter(it => !killed.has(it[0]));
                                    if (newStep.meta.attack == undefined) {
                                        newStep.meta.attack = [];
                                    }
                                    for (let it of killInfo) {
                                        newStep.meta.attack.push([piece.uuid, ...it]);
                                    }
                                } else if (it[0] == LoseSymbol) {
                                    newStep.board.losers.push(pieceOwner.get(piece.uuid).user);
                                }
                            }

                            steps.push(newStep);
                        }
                    }
                }

                ret.push(...analyzed);
            }
            return ret;
        }

        let ret = new Map();
        for (let piece of board.pieces) {
            let steps = doBehaviours(piece, imm ? BehaviourType.Immediately : BehaviourType.Initiative, board, {});
            for (let step of steps) {
                let cur = step;
                do {
                    for (let pPiece of cur.board.pieces) {
                        let passed = doBehaviours(pPiece, BehaviourType.Passive, cur.board, cur.meta);
                        if (passed.length > 0) {
                            // TODO: analyze states for cancel
                            cur.next = passed[0];
                            cur = cur.next;
                        }
                    }
                } while (cur.next != null);
            }
            if (steps.length > 0) {
                ret.set(piece.uuid, steps);
            }
        }
        return ret;
    }

    async doAnalyze() {
        const me = localStorage.getItem("user-uuid");
        const myRound = this._model.players[this._round % this._model.players.length].user == me;
        // test win
        if (this._model.losers.length + 1 == this._room.players.length && this._model.losers.find(it => it == me) == undefined) {
            this._win = true;
            this._check = false;
            return;
        }

        const pieceOwner = new Map();
        for (let it of this._model.nations) {
            let queue = [...it.sub];
            while (queue.length > 0) {
                if (queue[0] instanceof Entity) {
                    pieceOwner.set(queue[0].uuid, it.monarch);
                } else {
                    queue.push(queue[0].sub);
                }
                queue = queue.slice(1);
            }
        }

        let analyzed = this.analyzeActions(this._model, this._subRound != 0);

        // check or not
        {
            const meId = this._model.players.find(it => it.user == me).uuid;
            let check = false;
            for (let it of [...analyzed.entries()]) {
                if (pieceOwner.get(it[0]) != meId) {
                    continue;
                }
                for (let s of it[1]) {
                    let cur = s;
                    while (cur != null) {
                        for (let item of cur.states) {
                            if (item[0] == LoseSymbol) {
                                check = true;
                                break;
                            }
                        }
                        cur = cur.next;
                        if (check) {
                            break;
                        }
                    }
                    if (check) {
                        break;
                    }
                }
                if (check) {
                    break;
                }
            }
            this._check = check;
        }

        if (myRound) {
            this._analyzed = analyzed;
            if (this._analyzed.size == 0) {
                if (this._subRound == 0) {
                    this._model.losers.push(me);
                    await new Promise((resolve) => {
                        socket.emit("step", this._model.serial(), this._room.losers, resolve);
                    });
                }
                await new Promise((resolve) => {
                    socket.emit("fin-round", resolve);
                });
                this._round += 1;
                this._subRound = 0;
                await this.doAnalyze();
            }
        }
    }

    async loadPlayers(players) {
        this._playerNames = await Promise.all(players.map(async uuid => {
            let res = await fetch(`/name/${uuid}`);
            return [uuid, await res.json()];
        }));
        this.requestUpdate();
    }

    async clickCell(globalPos) {
        if (this._select == "") {
            let info = this._model.state.find(it => it[1][0] == globalPos[0] && it[1][1] == globalPos[1]);
            if (info == undefined) {
                return;
            }
            const me = this._model.players.find(it => it.user == localStorage.getItem("user-uuid"));
            for (let it of this._model.nations) {
                if (it.monarch == me.uuid) {
                    let queue = [...it.sub];
                    while (queue.length > 0) {
                        if (queue[0] instanceof Entity) {
                            if (queue[0].uuid == info[0]) {
                                if (this._analyzed.get(info[0]) != undefined) {
                                    this._select = info[0];
                                    console.log(this._select);
                                }
                                break;
                            }
                        } else {
                            queue.push(queue[0].sub);
                        }
                        queue = queue.slice(1);
                    }
                }
            }
        } else {
            let info = this._model.state.find(it => it[0] == this._select);
            if (info[1][0] == globalPos[0] && info[1][1] == globalPos[1]) {
                // do-cancel
                console.log("cancel select");
                this._select = "";
                return;
            }

            let steps = this._analyzed.get(this._select);

            let filtered = steps.filter(step => {
                let state = step.states.find(it => it[0] == CellSymbol);
                if (state == undefined) {
                    return false;
                }
                return state[1][0] == globalPos[0] && state[1][1] == globalPos[1];
            });

            if (filtered.length == 0) {
                return;
            } else if (filtered.length > 1) {
                this._availableStep = filtered;
                this.optionDialog.value.open();
                return;
            }

            // execute step
            await this.useStep(filtered[0]);
            this._select = "";
        }
    }

    viewStep(index) {
        this._viewIndex = index;
    }

    async clickOption(index) {
        this.optionDialog.value.close();
        let step = this._availableStep[index];

        await this.useStep(step);
        this._select = "";
        this._availableStep = null;
    }

    async useStep(step) {
        let loserSet = new Set(this._room.losers);
        let cur = step;
        let b = null;
        while (cur != null) {
            for (let it of cur.states) {
                if (it[0] == LoseSymbol) {
                    loserSet.add(it[1]);
                }
            }
            b = cur.board;
            cur = cur.next;
        }
        if (await new Promise((resolve) => {
            socket.emit("step", b.serial(), [...loserSet.keys()], resolve);
        })) {
            this._room.losers = [...loserSet.keys()];
            this._model.parse(b.serial());
            this._select = "";
            this._subRound += 1;
            this.doAnalyze();
        }
    }

    render() {
        if (this._model == null || !this.play) {
            return nothing;
        }
        const myRound = this._model.players[this._round % this._model.players.length].user == localStorage.getItem("user-uuid");
        const playerColor = this._model.players.map(p => {
            return this._model.nations.find(it => it.monarch == p.uuid)?.color ?? -1;
        });
        const colormap = Board.implDict.get(this._model.type).colormap;
        const me = this._model.players.find(it => it.user == localStorage.getItem("user-uuid"));
        const globalRange = this._model.size;
        const localRange = me.direct % 2 == 0 ? [globalRange[0], globalRange[1]] : [globalRange[1], globalRange[0]];

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
        for (let p of this._model.pieces) {
            let info = pieceColorIndex.find(it => it[0] == p.uuid) ?? ["", -1];
            pieceColor.set(p.uuid, info[1] < 0 ? 'transparent' : colormap[info[1]]);
        }

        let styledCells = [];
        if (this._select != "") {
            if (this._availableStep == null) {
                let steps = this._analyzed.get(this._select);
                for (let step of steps) {
                    if (step.descList.length == 0) {
                        continue;
                    }
                    let info = step.descList[step.descList.length - 1];
                    if (info[0] == DescInfoMove || info[0] == DescInfoAttack || info[0] == DescInfoMoveAttack) {
                        styledCells.push(info);
                    }
                }
            } else if (this._viewIndex >= 0) {
                let step = this._availableStep[this._viewIndex];
                for (let info of step.descList) {
                    if (info[0] == DescInfoMove || info[0] == DescInfoAttack || info[0] == DescInfoMoveAttack) {
                        styledCells.push(info);
                    }
                }
            }
        }

        return html`
        <div class="player-bar">
            ${map(this._playerNames, (it, index) => html`
            <div class="player-card ${this._round % this._model.players.length == index ? 'round' : ''}">
                <div style="background-color: ${playerColor[index] < 0 ? 'transparent' : colormap[playerColor[index]]};"></div>
                <div>${it[1]}</div>
            </div>
            `)}
        </div>
        <div class="main">
            <div class="board-body">
                ${map(Array(localRange[1]).keys(), rawY => {
            let inner = map(Array(localRange[0]).keys(), rawX => {
                let localX = rawX;
                let localY = this._model.size[1] - rawY - 1;
                let globalPos = posLocal2Global(this._model.size, [localX, localY], me.direct);
                let curPiece = this._model.state.find(it => it[1][0] == globalPos[0] && it[1][1] == globalPos[1]) ?? [""];
                let piece = this._model.pieces.find(it => it.uuid == curPiece[0]);

                let styled = styledCells.find(it => it[1][0] == globalPos[0] && it[1][1] == globalPos[1]);
                let styledClass = "";
                if (styled != undefined) {
                    if (styled[0] == DescInfoMove) {
                        styledClass = "move-aim";
                    } else if (styled[0] == DescInfoAttack) {
                        styledClass = "attack-aim";
                    } else if (styled[0] == DescInfoMoveAttack) {
                        styledClass = "move-attack-aim";
                    }
                }
                if (this._select != "" && this._select == curPiece[0]) {
                    styledClass = "select";
                }
                return html`
            <div data-x="${globalPos[0]}" data-y="${globalPos[1]}" class="cell ${styledClass}" @click="${() => this.clickCell(globalPos)}">
            ${when(piece != undefined, () => html`
                ${when(piece.img != "", () => html`
                <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 64 64" style="color: ${pieceColor.get(piece.uuid)};">
                    <use href="${piece.img + "#root"}" width="64" height="64" />
                </svg>
                `, () => html`
                <span class="material-symbols-outlined" style="font-size: 48px;">chess</span>
                `)}
            `, () => nothing)}
            </div>
            `;
            });
            return html`<div>${inner}</div>`;
        })}
            </div>
                ${when(!this.play || !myRound, () => html`
                <div class="lock" @click="${(e) => { e.stopPropagation(); }}"></div>
                `)}
            <div class="info-layer">
                ${when(this._check, () => html`
                <div style="font-size: 48px; color: red;">CHECK</div>
                `)}
                ${when(this._lose, () => html`
                <div style="font-size: 48px; color: red;">LOSE</div>
                `)}
                ${when(this._win, () => html`
                <div style="font-size: 48px; color: gray;">WIN</div>
                `)}
            </div>
            <popup-box ${ref(this.optionDialog)} backdrop @windowHide="${() => { this.viewStep(-1); this._select = ""; }}">
                <div class="option-menu-container" @click="${(e) => { this.optionDialog.value.close(); e.stopPropagation(); }}">
                    <div class="option-menu" @click="${(e) => e.stopPropagation()}">
                        ${when(this._availableStep != null, () => map(this._availableStep, (it, index) => html`
                        <div @mouseenter="${() => this.viewStep(index)}" @mouseleave="${() => this.viewStep(-1)}" @click="${() => this.clickOption(index)}">Option</div>
                        `), () => nothing)}
                    </div>
                </div>
            </popup-box>
        </div>
        `;
    }
}
customElements.define("mod-vanilla-basic-board-game", ModVanillaBasicBoardGame);
