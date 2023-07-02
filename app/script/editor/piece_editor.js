import { LitElement, html, css, ref, createRef, when, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Entity } from '../base/entity.js';
import { Behaviour } from '../base/behaviour.js';

import "../component/common_list.js";
import "./behaviour_editor.js";

class PieceEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _select: { state: true },
    };

    static styles = css`
    :host {
        background-color: white;
        box-sizing: border-box;
        width: 90vw;
        height: 90vh;
        display: grid;
        grid-template-columns: 256px calc(100% - 256px - 8px);
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
    `;

    constructor() {
        super();
        this._model = new Entity();
        this._select = null;
    }

    setModel(data) {
        let instance = new Entity();
        instance.parse(data);
        this._model = instance;
        this._select = null;
        this.behaviourListRef.value.setItems([...this._model.behaviours]);
    }

    behaviourListRef = createRef();
    behaviourEditorRef = createRef();

    delayTasks = [];

    onsubmit() {
        this.dispatchEvent(new CustomEvent("submit", { detail: this._model.serial() }));
    }

    oncancel() {
        this.dispatchEvent(new CustomEvent("cancel", {}));
    }

    newBehaviour() {
        let behaviour = new Behaviour();
        behaviour.uuid = UUIDv4();
        this._model.behaviours.push(behaviour);
        this.behaviourListRef.value.setItems([...this._model.behaviours]);
    }

    updateBehaviours(e) {
        this._model.behaviours = e.detail.map(uuid => {
            for (let it of this._model.behaviours) {
                if (it.uuid == uuid) {
                    return it;
                }
            }
            return null;
        }).filter(it => it !== null);
        this.behaviourListRef.value.setItems([...this._model.behaviours]);
    }

    selectBehaviour(e) {
        let uuid = e.detail;
        if (uuid == "") {
            this._select = null;
            return;
        }
        this._select = this._model.behaviours.find(it => it.uuid == uuid);
        this.delayTasks.push(() => {
            this.behaviourEditorRef.value.setModel(this._select);
        });
    }

    changeBehaviour(e) {
        this.behaviourListRef.value.setItems([...this._model.behaviours]);
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title-bar">
            <div style="flex-grow: 1; padding-left: 8px;">${this._model.name}</div>
            <div class="title-button" @click="${this.onsubmit}">
                <span class="material-symbols-outlined">done</span>
            </div>
            <div class="title-button" @click="${this.oncancel}">
                <span class="material-symbols-outlined">close</span>
            </div>
        </div>
        <div style="margin-left: 8px; margin-bottom: 8px;">
            <common-list titleText="behaviours" selectable ${ref(this.behaviourListRef)} @update="${this.updateBehaviours}" @select="${this.selectBehaviour}">
                <div slot="add" class="title-button" @click="${this.newBehaviour}">
                    <span class="material-symbols-outlined">add</span>
                </div>
            </common-list>
        </div>
        <div style="margin-right: 8px; margin-bottom: 8px;">
            ${when(this._select !== null, () => html`
            <behaviour-editor ${ref(this.behaviourEditorRef)} @change="${this.changeBehaviour}"></behaviour-editor>
            `, () => nothing)}
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
customElements.define("piece-editor", PieceEditor);
