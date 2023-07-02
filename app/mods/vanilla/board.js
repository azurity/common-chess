import { html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { BoardInfo, Board } from "../../script/base/board.js";

import "./board-editor.js";
import "./board-game.js";

const BasicBoardName = "vanilla.basic";

class BasicBoard extends Board {
    size = [8, 8];
    losers = [];
    constructor() {
        super();
        this.type = BasicBoardName;
        this.state = []; // [[uuid, [x, y]]]
    }
    serial() {
        let ret = super.serial();
        ret.size = [...this.size];
        ret.losers = [...this.losers];
        return ret;
    }
    parse(data) {
        super.parse(data);
        this.size = [...data.size];
        this.losers = [...data.losers];
    }
    reID() {
        let pieceMap = new Map(this.pieces.map((it, index) => [it.uuid, index]));
        super.reID();
        this.state = this.state.map(it => [this.pieces[pieceMap.get(it[0])].uuid, it[1]]);
    }
}

let info = new BoardInfo();
info.Class = BasicBoard;
info.colormap = ['white', 'black'];
info.editor = (ref) => html`<mod-vanilla-basic-board-editor ${ref}></mod-vanilla-basic-board-editor>`;
info.game = (ref, play) => html`<mod-vanilla-basic-board-game ${ref} ?play="${play}"></mod-vanilla-basic-board-game>`;
Board.implDict.set(BasicBoardName, info);
