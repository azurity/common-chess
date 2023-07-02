import { LitElement, html, css, ref, createRef, map } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Behaviour, BehaviourType } from '../base/behaviour.js';
import { Action } from '../base/action.js';

import "../component/input_box.js";
import "../component/common_list.js";
import "../component/popup_box.js";
import "../component/select_box.js";
import "./action_editor.js";

class BehaviourEditor extends LitElement {
    static properties = {
        _nameEdit: { state: true },
        _model: { state: true },
        _name: { state: true },
        _type: { state: true },
    };

    static styles = css`
    .container {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 4px dashed rgb(127 127 127 / 0.4);
        padding: 8px;
        display: grid;
        grid-gap: 8px;
        grid-auto-flow: column;
        grid-template-rows: 24px 24px calc(100% - 64px);
        grid-template-columns: 320px calc(100% - 320px);
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
    .menu > * {
        height: 24px;
        border-bottom: 1px solid rgb(127 127 127 / 0.2);
        user-select: none;
        cursor: pointer;
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
        this._model = new Behaviour();
        this._name = "";
        this._nameEdit = false;
        this._type = "Initiative";
    }

    setModel(model) {
        this._model = model;
        this._name = this._model.name;
        this._nameEdit = false;
        this._type = Object.keys(BehaviourType).find(it => BehaviourType[it] == this._model.type);
        this.delayTasks.push(() => {
            this.actionListRef.value.setItems([...this._model.actions]);
        });
    }

    nameEditor = createRef();
    actionListRef = createRef();
    actionMenuRef = createRef();
    actionEditorDialog = createRef();
    actionEditorRef = createRef();

    delayTasks = [];

    changeName(e) {
        this._model.name = e.detail;
        this._name = this._model.name;
        this.dispatchEvent(new CustomEvent("change"));
    }

    editName() {
        this._nameEdit = true;
        this.nameEditor.value.focus();
    }

    changeType(e) {
        this._model.type = BehaviourType[e.detail];
        this._type = e.detail;
        this.dispatchEvent(new CustomEvent("change"));
    }

    newAction(e) {
        this.actionMenuRef.value.close();
        let id = e.currentTarget.dataset["id"];
        let action = new (Action.implDict.get(id).Class)();
        action.uuid = UUIDv4();
        this._model.actions.push(action);
        this.actionListRef.value.setItems([...this._model.actions]);
    }

    updateActions(e) {
        this._model.actions = e.detail.map(uuid => {
            for (let it of this._model.actions) {
                if (it.uuid == uuid) {
                    return it;
                }
            }
            return null;
        }).filter(it => it !== null);
        this.actionListRef.value.setItems([...this._model.actions]);
    }

    selectAction(e) {
        let uuid = e.detail;
        if (uuid != "") {
            let item = this._model.actions.find(it => it.uuid == uuid);
            if (item != undefined) {
                this.actionEditorDialog.value.open();
                this.actionEditorRef.value.setModel(item.serial());
            }
        }
    }

    changeAction(e) {
        this.actionEditorDialog.value.close();
        let data = e.detail;
        let item = this._model.actions.find(it => it.uuid == data.uuid);
        item.parse(data);
        this.actionListRef.value.setItems([...this._model.actions]);
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="container">
            <input-box value="${this._name}" ${ref(this.nameEditor)} ?disabled="${!this._nameEdit}" @change="${this.changeName}" @blur="${() => { this._nameEdit = false; }}">
                <div slot="prepend-inner" style="height: 100%; aspect-ratio: 1;" @click="${this.editName}">
                    <span class="material-symbols-outlined">edit</span>
                </div>
            </input-box>
            <select-box value="${this._type}" @change="${this.changeType}">
                <div data-id="Passive">Passive</div>
                <div data-id="Immediately">Immediately</div>
                <div data-id="Initiative">Initiative</div>
            </select-box>
            <common-list titleText="actions" ${ref(this.actionListRef)} @update="${this.updateActions}" @select="${this.selectAction}">
                <div slot="add">
                    <div class="title-button" @click="${() => { this.actionMenuRef.value.open(); }}">
                        <span class="material-symbols-outlined">add</span>
                    </div>
                    <popup-box ${ref(this.actionMenuRef)} local>
                        <div class="menu">
                            ${map(Action.implDict.keys(), (key) => html`
                            <div data-id="${key}" @click="${this.newAction}">${key}</div>
                            `)}
                        </div>
                    </popup-box>
                </div>
            </common-list>
        </div>
        <popup-box ${ref(this.actionEditorDialog)} backdrop hold>
            <action-editor ${ref(this.actionEditorRef)} @submit="${this.changeAction}" @cancel="${() => { this.actionEditorDialog.value.close(); }}"></action-editor>
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
customElements.define("behaviour-editor", BehaviourEditor);
