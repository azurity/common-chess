import { LitElement, html, css, ref, createRef, when, map, choose, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { Action, FormItemType } from '../base/action.js';

import "../component/input_box.js";
import "./form_item_editor.js";

import * as monaco from 'https://esm.sh/monaco-editor@0.39.0';
import editorWorker from 'https://esm.sh/monaco-editor@0.39.0/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'https://esm.sh/monaco-editor@0.39.0/esm/vs/language/json/json.worker?worker';
import cssWorker from 'https://esm.sh/monaco-editor@0.39.0/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'https://esm.sh/monaco-editor@0.39.0/esm/vs/language/html/html.worker?worker';
import tsWorker from 'https://esm.sh/monaco-editor@0.39.0/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === "json") {
            return new jsonWorker();
        }
        if (label === "css" || label === "scss" || label === "less") {
            return new cssWorker();
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
            return new htmlWorker();
        }
        if (label === "typescript" || label === "javascript") {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

class ConditionCodeEditor extends LitElement {
    static properties = {
        _model: { state: true },
    };

    static styles = css`
    :host {
        overflow: hidden;
    }
    .root {
        width: 100%;
        aspect-ratio: 2 / 1;
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        position: relative;
    }
    .container {
        width: 100%;
        height: 100%;
    }
    .button {
        right: 0;
        top: 0;
        width: 32px;
        height: 32px;
        position: absolute;;
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
    `;

    constructor() {
        super();
        this._model = "";
    }

    reset(meta, model) {
        this._model = model;
        this.delayTasks.push(() => {
            this.editor.setValue(model);
        });
        this.requestUpdate();
    }

    container = createRef();
    editor;

    delayTasks = [];

    onChange() {
        let code = this.editor.getValue();
        this._model = code;
        this.dispatchEvent(new CustomEvent("change", { detail: code, bubbles: false }));
    }

    // isDark() {
    //     return (
    //         window.matchMedia &&
    //         window.matchMedia("(prefers-color-scheme: dark)").matches
    //     );
    // }

    render() {
        return html`
        <div class="root">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/min/vs/editor/editor.main.css" />
        <main class="container" ${ref(this.container)}></main>
        <div class="button">
            <span class="material-symbols-outlined" @click="${this.onChange}">save</span>
        </div>
        </div>
        `;
    }

    firstUpdated() {
        this.editor = monaco.editor.create(this.container.value, {
            value: this._model,
            language: "chessCond",
            // theme: this.isDark() ? "vs-dark" : "vs-light",
            theme: "vs-light",
        });
        // window
        //     .matchMedia("(prefers-color-scheme: dark)")
        //     .addEventListener("change", () => {
        //         monaco.editor.setTheme(this.isDark() ? "vs-dark" : "vs-light");
        //     });
    }

    updated() {
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
    }
}
customElements.define("condition-code-editor", ConditionCodeEditor);

class ActionEditor extends LitElement {
    static properties = {
        _model: { state: true },
        _nameEdit: { state: true },
        _name: { state: true },
    };

    static styles = css`
    :host {
        background-color: white;
        box-sizing: border-box;
        width: 90vw;
        height: 90vh;
        display: grid;
        grid-template-rows: 32px calc(100% - 32px);
        border: 4px dashed rgb(127 127 127 / 0.4);
    }
    .title-bar {
        height: 32px;
        font-size: 24px;
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
    .container {
        width: 100%;
        height: 100%;
        overflow-x: auto;
        padding: 8px;
        box-sizing: border-box;
    }
    .label {
        margin: 4px;
        font-size: 16px;
        line-height: 20px;
        color: gray;
    }
    `;

    constructor() {
        super();
        this._model = new Action();
        this._name = this._model.name;
    }

    setModel(data) {
        let info = Action.implDict.get(data.type);
        let instance = new info.Class();
        instance.parse(data);
        this._model = instance;
        this._name = this._model.name;
        this.formItemRefs = info.items.map(it => createRef());
        this.delayTasks.push(() => {
            info.items.map((it, index) => {
                this.formItemRefs[index].value.reset(it.extra, this._model[it.propName]);
            });
        });
    }

    nameEditor = createRef();
    formItemRefs = [];

    delayTasks = [];

    onsubmit() {
        this.dispatchEvent(new CustomEvent("submit", { detail: this._model.serial() }));
    }

    oncancel() {
        this.dispatchEvent(new CustomEvent("cancel", {}));
    }

    onchange(e, index) {
        let info = Action.implDict.get(this._model.type);
        this._model[info.items[index].propName] = e.detail;
    }

    changeName(e) {
        this._model.name = e.detail;
        this._name = this._model.name;
    }

    editName() {
        this._nameEdit = true;
        this.nameEditor.value.focus();
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title-bar">
            <div style="width: 320px;">
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
        <div class="container">
        ${when(this._model.type != "", () => map(Action.implDict.get(this._model.type).items, (it, index) => choose(it.type, [
            [FormItemType.number, () => html`
            <div class="label">${it.name}</div>
            <number-form-item-editor ${ref(this.formItemRefs[index])} @change="${(e) => this.onchange(e, index)}"></number-form-item-editor>
            `],
            [FormItemType.enum, () => html`
            <div class="label">${it.name}</div>
            <enum-form-item-editor ${ref(this.formItemRefs[index])} @change="${(e) => this.onchange(e, index)}"></enum-form-item-editor>
            `],
            [FormItemType.mask, () => html`
            <div class="label">${it.name}</div>
            <mask-form-item-editor ${ref(this.formItemRefs[index])} @change="${(e) => this.onchange(e, index)}"></mask-form-item-editor>
            `],
            [FormItemType.switch, () => html`
            <div class="label">${it.name}</div>
            <switch-form-item-editor ${ref(this.formItemRefs[index])} @change="${(e) => this.onchange(e, index)}"></switch-form-item-editor>
            `],
            [FormItemType.other, () => html`
            <div class="label">${it.name}</div>
            <other-form-item-editor ${ref(this.formItemRefs[index])} @change="${(e) => this.onchange(e, index)}"></other-form-item-editor>
            `],
        ])), () => nothing)}
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
customElements.define("action-editor", ActionEditor);
