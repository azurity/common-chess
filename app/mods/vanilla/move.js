import { LitElement, html, css, ref, createRef, when, map, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { ActionInfo, Action, FormItemType, FormItem, FromItemMaskExtra, FormItemNumberExtra, FormItemOtherExtra } from "../../script/base/action.js";
import { posLocal2Global } from './cond.js';
import { Nation } from '../../script/base/nation.js';

export const MoveType = {
    move: 1 << 0,
    attack: 1 << 1,
    move_attack: 1 << 2,
};

export const PositionSymbol = Symbol("position"); // [Symbol, pos]
export const AttackSymbol = Symbol("attack"); // [Symbol, ...pieces]
export const CellSymbol = Symbol("cell"); // [Symbol, pos]

export const DescInfoMove = Symbol("move");
export const DescInfoAttack = Symbol("attack");
export const DescInfoMoveAttack = Symbol("move_attack");

const MoveActionName = "vanilla.move";

function mergeState(older, newer) {
    let ret = [];
    let used = new Map();
    for (let it of older) {
        used.set(it[0], ret.length);
        ret.push([...it]);
    }
    for (let it of newer) {
        if (it[0] == AttackSymbol) {
            let i = used.get(AttackSymbol);
            if (i != undefined) {
                ret[i].push(...it.slice(1));
                continue;
            }
        }
        let i = used.get(it[0]);
        if (i != undefined) {
            ret[i] = [...it];
        } else {
            ret.push([...it]);
        }
    }
    return ret;
}

export class MoveAction extends Action {
    moveType = MoveType.move | MoveType.move_attack;
    loop = false;
    loopLimit = 1;
    stepPosition = [];
    constructor() {
        super();
        this.type = MoveActionName;
    }
    serial() {
        let ret = super.serial();
        ret.moveType = this.moveType;
        ret.loop = this.loop;
        ret.loopLimit = this.loopLimit;
        ret.stepPosition = JSON.parse(JSON.stringify(this.stepPosition));
        return ret;
    }
    parse(data) {
        super.parse(data);
        this.moveType = data.moveType;
        this.loop = data.loop;
        this.loopLimit = data.loopLimit;
        this.stepPosition = JSON.parse(JSON.stringify(data.stepPosition));
    }
    step(board, state, piece) {
        const owner = (() => {
            for (let it of board.nations) {
                let queue = [...it.sub];
                while (queue.length > 0) {
                    if (queue[0].uuid == piece.uuid) {
                        return board.players.find(p => p.uuid == it.monarch) ?? null;
                    }
                    if (queue[0] instanceof Nation) {
                        queue.push(...queue[0].sub);
                    }
                    queue = queue.slice(1);
                }
            }
            return null;
        })();
        if (owner == null) {
            return [[], []];
        }
        const myInfo = state.find(it => it[0] == PositionSymbol);
        if (myInfo == undefined) {
            // out of board
            return [[], []];
        }
        const myPos = myInfo[1];
        let retS = [];
        let retD = [];
        for (let aim of this.stepPosition) {
            let gPos = posLocal2Global(board.size, aim, owner.direct, true);
            if (this.loop) {
                if (gPos[0] == 0 && gPos[1] == 0) {
                    continue;
                }
                let aim = [...myPos];
                while (true) {
                    aim = [aim[0] + gPos[0], aim[1] + gPos[1]];
                    if (aim[0] < 0 || aim[0] >= board.size[0] || aim[1] < 0 || aim[1] >= board.size[1]) {
                        break;
                    }
                    let aimPieceInfo = board.state.find(it => it[1][0] == aim[0] && it[1][1] == aim[1]);
                    let aimPiece = null;
                    if (aimPieceInfo != undefined) {
                        aimPiece = board.pieces.find(it => it.uuid == aimPieceInfo[0]) ?? null;
                    }
                    if (aimPiece != null) {
                        const aimOwner = (function () {
                            for (let it of board.nations) {
                                let queue = [...it.sub];
                                while (queue.length > 0) {
                                    if (queue[0].uuid == aimPiece.uuid) {
                                        return board.players.find(p => p.uuid == it.monarch) ?? null;
                                    }
                                    if (queue[0] instanceof Nation) {
                                        queue.push(...queue[0].sub);
                                    }
                                    queue = queue.slice(1);
                                }
                            }
                            return null;
                        })();
                        if (owner != aimOwner) {
                            if ((this.moveType & MoveType.move_attack) != 0) {
                                retS.push(mergeState(state, [[CellSymbol, [...aim]], [PositionSymbol, [...aim]], [AttackSymbol, aimPiece.uuid]]));
                                retD.push([[DescInfoMoveAttack, [...aim]]]);
                            }
                            if ((this.moveType & MoveType.attack) != 0) {
                                retS.push(mergeState(state, [[CellSymbol, [...aim]], [AttackSymbol, aimPiece.uuid]]));
                                retD.push([[DescInfoAttack, [...aim]]]);
                            }
                        }
                        break;
                    } else {
                        if ((this.moveType & (MoveType.move | MoveType.move_attack)) != 0) {
                            retS.push(mergeState(state, [[CellSymbol, [...aim]], [PositionSymbol, [...aim]]]));
                            retD.push([[DescInfoMove, [...aim]]]);
                        }
                    }
                }
            } else {
                let aim = [myPos[0] + gPos[0], myPos[1] + gPos[1]];
                if (aim[0] < 0 || aim[0] >= board.size[0] || aim[1] < 0 || aim[1] >= board.size[1]) {
                    continue;
                }
                let aimPieceInfo = board.state.find(it => it[1][0] == aim[0] && it[1][1] == aim[1]);
                let aimPiece = null;
                if (aimPieceInfo != undefined) {
                    aimPiece = board.pieces.find(it => it.uuid == aimPieceInfo[0]) ?? null;
                }
                if (aimPiece != null) {
                    const aimOwner = (function () {
                        for (let it of board.nations) {
                            let queue = [...it.sub];
                            while (queue.length > 0) {
                                if (queue[0].uuid == aimPiece.uuid) {
                                    return board.players.find(p => p.uuid == it.monarch) ?? null;
                                }
                                if (queue[0] instanceof Nation) {
                                    queue.push(...queue[0].sub);
                                }
                                queue = queue.slice(1);
                            }
                        }
                        return null;
                    })();
                    if (owner != aimOwner) {
                        if ((this.moveType & MoveType.move_attack) != 0) {
                            retS.push(mergeState(state, [[CellSymbol, [...aim]], [PositionSymbol, [...aim]], [AttackSymbol, aimPiece.uuid]]));
                            retD.push([[DescInfoMoveAttack, [...aim]]]);
                        }
                        if ((this.moveType & MoveType.attack) != 0) {
                            retS.push(mergeState(state, [[CellSymbol, [...aim]], [AttackSymbol, aimPiece.uuid]]));
                            retD.push([[DescInfoAttack, [...aim]]]);
                        }
                    }
                } else {
                    if ((this.moveType & (MoveType.move | MoveType.move_attack)) != 0) {
                        retS.push(mergeState(state, [[CellSymbol, [...aim]], [PositionSymbol, [...aim]]]));
                        retD.push([[DescInfoMove, [...aim]]]);
                    }
                }
            }
        }

        // new states, desc-lists
        return [retS, retD];
    }
}

class ModVanillaMovePositionEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _range: { state: true },
    };

    static styles = css`
    :host {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .board {
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .board > :nth-child(2n) > :nth-child(2n),
    .board > :nth-child(2n + 1) > :nth-child(2n + 1) {
        background-color: white;
    }
    .board > :nth-child(2n + 1) > :nth-child(2n),
    .board > :nth-child(2n) > :nth-child(2n + 1) {
        background-color: lightgray;
    }
    .board > * {
        display: flex;
    }
    .cell {
        width: 64px;
        height: 64px;
        box-sizing: border-box;
        position: relative;
        user-select: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid transparent;
    }
    .cell::before {
        content: '';
        width: 100%;
        height: 100%;
        position: absolute;
        border: 4px dashed transparent;
    }
    .cell:hover::before {
        border-color: #FFD700;
    }
    .cell.select {
        border: 4px solid gray;
    }
    `;

    constructor() {
        super();
        this._model = [];
        this._range = 1;
        this.rangeMeta.min = 1;
    }

    rangeMeta = new FormItemNumberExtra();
    rangeRef = createRef();

    delayTasks = [];

    reset(meta, model) {
        this._model = model;
        this.setRange(this._range);
    }

    get minRange() {
        let max = this._model.reduce((a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1])], [0, 0]);
        return Math.max(max[0], max[1]);
    }

    setRange(range) {
        this._range = Math.max(this.minRange, range);
        this.delayTasks.push(() => {
            this.rangeRef.value.reset(this.rangeMeta, this._range);
        });
        this.requestUpdate();
    }

    togglePosition(e) {
        let x = parseInt(e.target.dataset["x"]);
        let y = parseInt(e.target.dataset["y"]);
        let index = this._model.findIndex(it => it[0] == x && it[1] == y);
        let newModel = [];
        if (index >= 0) {
            newModel = this._model.filter((_, i) => i != index);
        } else {
            newModel = [...this._model, [x, y]];
        }
        this._model = newModel;
        this.dispatchEvent(new CustomEvent("change", { detail: this._model }));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="board">
            ${map([...Array(this._range * 2 + 1).keys()],
            (row) => html`
            <div>
                ${map([...Array(this._range * 2 + 1).keys()],
                (col) => {
                    let x = col - this._range;
                    let y = row - this._range;
                    let selected = this._model.find(it => it[0] == x && it[1] == -y) != undefined;
                    return html`
                    <div data-x="${x}" data-y="${-y}" class="cell ${selected ? 'select' : ''}" @click="${this.togglePosition}">
                        ${when(x == 0 && y == 0, () => html`
                        <span class="material-symbols-outlined" style="font-size: 48px;">chess</span>
                        `, () => nothing)}
                    </div>
                    `;
                })}
            </div>
            `)}
        </div>
        <div style="display: flex;">
            <span>range:</span>
            <div style="width: 320px;">
                <number-form-item-editor ${ref(this.rangeRef)} @change="${(e) => this.setRange(e.detail)}"></number-form-item-editor>
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
customElements.define("mod-vanilla-move-position-editor", ModVanillaMovePositionEditor);

let moveTypeInfo = new FormItem();
moveTypeInfo.name = "move type";
moveTypeInfo.propName = "moveType";
moveTypeInfo.type = FormItemType.mask;
moveTypeInfo.extra = new FromItemMaskExtra();
moveTypeInfo.extra.items = Object.keys(MoveType).map(it => [it, MoveType[it]]);

let loopInfo = new FormItem();
loopInfo.name = "loop";
loopInfo.propName = "loop";
loopInfo.type = FormItemType.switch;

let loopLimitInfo = new FormItem();
loopLimitInfo.name = "loop times limit";
loopLimitInfo.propName = "loopLimit";
loopLimitInfo.type = FormItemType.number;
loopLimitInfo.extra = new FormItemNumberExtra();
loopLimitInfo.extra.min = 1;

let stepPositionInfo = new FormItem();
stepPositionInfo.name = "step position";
stepPositionInfo.propName = "stepPosition";
stepPositionInfo.type = FormItemType.other;
stepPositionInfo.extra = new FormItemOtherExtra();
stepPositionInfo.extra.editor = (ref, onchange) => html`<mod-vanilla-move-position-editor ${ref} @change="${onchange}"></mod-vanilla-move-position-editor>`;

let info = new ActionInfo();
info.Class = MoveAction;
info.items = [moveTypeInfo, loopInfo, loopLimitInfo, stepPositionInfo];
Action.implDict.set(MoveActionName, info);
