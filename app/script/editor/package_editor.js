import { LitElement, html, css, ref, createRef, repeat } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Package } from '../base/package.js';
import { Entity } from '../base/entity.js';

import "../component/check_box.js";
import "../component/input_box.js";
import "./piece_editor.js";

class PieceCardEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _name: { state: true },
        _nameEdit: { state: true },
        _url: { state: true },
    };

    static styles = css`
    .piece-card-pic {
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        position: relative;
    }
    .piece-card-pic::before {
        content: '';
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        aspect-ratio: 1;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .pic-button {
        position: absolute;
        left: 4px;
        top: 4px;
        width: 24px;
        aspect-ratio: 1px;
        user-select: none;
        cursor: pointer;
    }
    svg {
        width: 100%;
        height: 100%;
    }
    .piece-card-title {
        width: 100%;
        height: 24px;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        border-top: none;
        border-bottom: none;
    }
    .piece-card-action {
        width: 100%;
        height: 24px;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        border-top: none;
        font-size: 16px;
        line-height: 22px;
        display: flex;
        justify-content: center;
    }
    .piece-card-action > * {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    .pic-button:hover,
    .piece-card-action > :hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    `;

    constructor() {
        super();
        this._model = new Entity();
        this._name = "";
        this._url = "";
        this._nameEdit = false;
    }

    setModel(model) {
        this._model = model;
        this._name = this._model.name;
        this._url = this._model.img == "" ? "" : this._model.img + "#root";
    }

    nameEditor = createRef();
    fileInputRef = createRef();

    changeName(e) {
        this._model.name = e.detail;
        this._name = this._model.name;
    }

    editName() {
        this._nameEdit = true;
        this.nameEditor.value.focus();
    }

    changeImage(e) {
        const reader = new FileReader();
        reader.onload = () => {
            let url = reader.result;
            this._model.img = url;
            this._url = url + "#root";
        };
        reader.readAsDataURL(e.target.files[0]);
        e.target.value = "";
    }

    editImage() {
        this.fileInputRef.value.click();
    }

    onEdit() {
        this.dispatchEvent(new CustomEvent("edit", { detail: this._model.uuid }));
    }

    onDelete() {
        this.dispatchEvent(new CustomEvent("delete", { detail: this._model.uuid }));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="piece-card-pic">
            <svg xmlns="http://www.w3.org/2000/svg"viewBox="0 0 64 64" style="color: transparent;">
                <use href="${this._url}" width="64" height="64" />
            </svg>
            <div class="pic-button" @click="${this.editImage}">
                <span class="material-symbols-outlined">edit</span>
                <input accept="image/svg+xml,.svg" type="file" style="display: none;" ${ref(this.fileInputRef)} @change="${this.changeImage}">
            </div>
        </div>
        <div class="piece-card-title">
        <input-box value="${this._name}" ${ref(this.nameEditor)} ?disabled="${!this._nameEdit}" @change="${this.changeName}" @blur="${() => { this._nameEdit = false; }}">
            <div slot="prepend-inner" style="height: 100%; aspect-ratio: 1;" @click="${this.editName}">
                <span class="material-symbols-outlined">edit</span>
            </div>
        </input-box>
        </div>
        <div class="piece-card-action">
            <div @click="${this.onEdit}">EDIT</div>
            <div @click="${this.onDelete}">DELETE</div>
        </div>
        `;
    }
}
customElements.define("piece-card-editor", PieceCardEditor);

class PackageEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _optionModel: { state: true },
        _list: { state: true },
        _name: { state: true },
        _nameEdit: { state: true },
    };

    static styles = css`
    :host {
        background-color: white;
        box-sizing: border-box;
        width: 90vw;
        height: 90vh;
        display: grid;
        /* grid-template-columns: 256px calc(100% - 256px - 8px); */
        grid-template-rows: 32px calc(100% - 40px);
        grid-gap: 8px;
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .title-bar {
        /* grid-column: 1 / span 2; */
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
    /* .option-title-bar {
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        height: 32px;
        line-height: 24px;
        font-size: 20px;
        padding-left: 8px;
    }
    .option-list {
        width: 100%;
        height: calc(100% - 32px);
        overflow-x: hidden;
        overflow-y: scroll;
        background-color: rgb(127 127 127 / 0.1);
    } */
    .piece-list {
        margin-left: 8px;
        margin-right: 8px;
        margin-bottom: 8px;
        width: calc(100% - 8px);
        height: calc(100% - 8px);
        overflow-x: hidden;
        overflow-y: scroll;
        display: grid;
        grid-template-columns: repeat(auto-fill, 192px);
        grid-auto-rows: 240px;
        grid-gap: 8px;
        justify-content: space-around;
    }
    .piece-card {
        width: 192px;
        height: 240px;
        /* box-shadow: inset 0 0 2px black; */
    }
    .piece-add {
        width: 192px;
        height: 240px;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        cursor: pointer;
    }
    .piece-add:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    `;

    constructor() {
        super();
        this._model = new Package();
        this._optionModel = [];
        this._list = [];
        this._name = "";
        this._nameEdit = false;
    }

    setModel(data) {
        let instance = new Package();
        instance.parse(data);
        this._model = instance;
        this._name = this._model.name;
        this._nameEdit = false;
        this.refresh();
    }

    nameEditor = createRef();

    refresh() {
        this._list = [...this._model.entities];
        this.cardRefs = this._model.entities.map(() => createRef());
        this.delayTasks.push(() => {
            this._list.map((it, index) => {
                this.cardRefs[index].value.setModel(it);
            });
        });
    }

    cardRefs = [];
    pieceEditorDialog = createRef();
    pieceEditorRef = createRef();

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

    newPiece() {
        let piece = new Entity();
        piece.uuid = UUIDv4();
        this._model.entities.push(piece);
        this.refresh();
    }

    editPiece(e) {
        let uuid = e.target.dataset["id"];
        if (uuid != "") {
            let item = this._model.entities.find(it => it.uuid == uuid);
            if (item != undefined) {
                this.pieceEditorDialog.value.open();
                this.pieceEditorRef.value.setModel(item.serial());
            }
        }
    }

    deletePiece(e) {
        let uuid = e.target.dataset["id"];
        this._model.entities = this._model.entities.filter(it => it.uuid != uuid);
        this.refresh();
    }

    changePiece(e) {
        this.pieceEditorDialog.value.close();
        let data = e.detail;
        let item = this._model.entities.find(it => it.uuid == data.uuid);
        item.parse(data);
    }

    render() {
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
        <div class="piece-list">
            ${repeat(this._list, it => it.uuid, (it, index) => html`
            <div class="piece-card">
                <piece-card-editor data-id="${it.uuid}" ${ref(this.cardRefs[index])} @edit="${this.editPiece}" @delete="${this.deletePiece}"></piece-card-editor>
            </div>
            `)}
            <div class="piece-add" @click="${this.newPiece}">
                <span class="material-symbols-outlined">add</span>
            </div>
        </div>
        <popup-box ${ref(this.pieceEditorDialog)} backdrop hold>
            <piece-editor ${ref(this.pieceEditorRef)} @submit="${this.changePiece}" @cancel="${() => { this.pieceEditorDialog.value.close(); }}"></piece-editor>
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
customElements.define("package-editor", PackageEditor);
