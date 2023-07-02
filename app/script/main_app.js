import { LitElement, html, css, choose, ref, createRef } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

import "./game_hall.js";
import "./editor/resource_space.js";
import "./component/input_box.js";
import { Condition } from './base/action.js';

class MainApp extends LitElement {
    static properties = {
        _tab: { state: true },
        _name: { state: true },
    };

    constructor() {
        super();
        this._tab = 0;
        this._name = "";
    }

    static styles = css`
    :host {
        width: 100vw;
        height: 100vh;
        display: grid;
        grid-template-rows: 32px calc(100% - 32px);
    }
    .tabs {
        display: flex;
        justify-content: center;
        border-bottom: 4px dashed rgb(127 127 127 / 0.4);
    }
    .tabs > * {
        padding: 0 8px;
        user-select: none;
        cursor: pointer;
        font-size: 24px;
        line-height: 28px;
    }
    .tabs > :hover,
    .tabs > .select:hover {
        background-color: rgb(127 127 127 / 0.3);
    }
    .tabs > .select {
        background-color: rgb(127 127 127 / 0.2);
    }
    .nickname {
        padding: 8px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        background-color: white;
    }
    .help-box {
        width: 90vw;
        height: 90vh;
        border: 4px dashed rgb(127 127 127 / 0.4);
        overflow: auto;
        background-color: white;
    }
    `;

    nicknameDialog = createRef();
    documentDialog = createRef();

    changeName(e) {
        this._name = e.detail;
    }

    async submitName() {
        this.nicknameDialog.value.close();
        let res = await fetch('/rename', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uuid: localStorage.getItem("user-uuid"),
                name: this._name,
            }),
        });
        if (res.status != 200) {
            console.log('rename failed');
        }
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="tabs">
            <div class="${this._tab == 0 ? 'select' : ''}" @click="${() => { this._tab = 0; }}">play</div>
            <div class="${this._tab == 1 ? 'select' : ''}" @click="${() => { this._tab = 1; }}">editor</div>
            <div @click="${() => { this.nicknameDialog.value.open(); }}">nickname</div>
            <div @click="${() => { this.documentDialog.value.open(); }}">condition doc</div>
        </div>
        ${choose(this._tab, [
            [0, () => html`
            <div style="margin-top: 8px;">
                <game-hall></game-hall>
            </div>
            `],
            [1, () => html`
            <div style="margin-top: 8px;">
                <resource-space></resource-space>
            </div>
            `],
        ])}
        <popup-box ${ref(this.nicknameDialog)} backdrop>
            <div class="nickname">
                <input-box value="${this._name}" @change="${this.changeName}">
                    <div slot="append-inner" style="height: 100%; aspect-ratio: 1;" @click="${this.submitName}">
                        <span class="material-symbols-outlined">done</span>
                    </div>
                </input-box>
            </div>
        </popup-box>
        <popup-box ${ref(this.documentDialog)} backdrop>
            <div class="help-box">
                <pre>${[...Condition.implDict.entries()].map(([key ,value]) => value.doc ?? `(${key} ...)`).join('\n\n')}</pre>
            </div>
        </popup-box>
        `;
    }
}
customElements.define("main-app", MainApp);
