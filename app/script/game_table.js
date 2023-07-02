import { LitElement, html, css, ref, createRef, when, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import socket from './socket.js';
import { Board } from './base/board.js';

class GameTable extends LitElement {
    static properties = {
        _model: { state: true },
        _play: { state: true },
        _playerName: { state: true },
    };

    static styles = css`
    :host {
        display: block;
        width: 100vw;
        height: 100vh;
        position: relative;
        background-color: white;
    }
    /* :host::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
    } */
    .button {
        right: 4px;
        top: 4px;
        width: 32px;
        height: 32px;
        position: absolute;
        aspect-ratio: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .button:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .main-menu {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        background-color: white;
    }
    .main-menu > * {
        display: block;
        width: 240px;
        height: 40px;
        display: flex;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }
    .main-menu > .menu-button {
        border: 4px dashed rgb(127 127 127 / 0.4);
        user-select: none;
        cursor: pointer;
    }
    .main-menu > .menu-button:hover {
        background-color: rgb(127 127 127 / 0.3);
    }
    `;

    boardRef = createRef();
    mainMenuDialog = createRef();

    constructor() {
        super();
        this._model = null;
        this._play = false;
    }

    open() {
        socket.once("exit-room", async uuid => {
            let res = await fetch(`/name/${uuid}`);
            let name = await res.json();
            alert(`${name} exit room`);
            this.close();
        });
        socket.on("offline", async uuid => {
            let res = await fetch(`/name/${uuid}`);
            let name = await res.json();
            alert(`${name} offline`);
        });
        socket.once("start", roomInfo => {
            this.setRoomInfo(roomInfo);
        });
        socket.on("step", roomInfo => {
            this.setRoomInfo(roomInfo);
        });
    }

    close() {
        socket.off("exit-room");
        socket.off("offline");
        socket.emit("room-info", () => { }); // refresh
        this.dispatchEvent(new CustomEvent("exit"));
    }

    setModel(model) {
        let boardBase = Board.implDict.get(model.type);
        let instance = new boardBase.Class();
        instance.parse(model.serial());
        this._model = instance;
        this.delayTasks.push(() => {
            this.gameRef.value.setModel(this._model);
        });
    }

    gameRef = createRef();

    delayTasks = [];

    setRoomInfo(roomInfo) {
        console.log(roomInfo);
        this._play = roomInfo.play;
        this.gameRef.value.setState(roomInfo);
    }

    async leave() {
        await new Promise((resolve) => {
            socket.emit("exit-room", resolve);
        });
        this.mainMenuDialog.value.close();
        this.close();
        location.reload();
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        ${when(this._model != null, () => Board.implDict.get(this._model.type).game(ref(this.gameRef), this._play), () => nothing)}
        <div class="button">
            <span class="material-symbols-outlined" @click="${() => { this.mainMenuDialog.value.open(); }}">menu</span>
        </div>
        <popup-box  ${ref(this.mainMenuDialog)} backdrop>
            <div class="main-menu">
                <div>MENU</div>
                <div class="menu-button" @click="${() => { this.mainMenuDialog.value.close(); }}">resume</div>
                <div class="menu-button" @click="${this.leave}">leave</div>
            </div>
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
customElements.define("game-table", GameTable);
