import { LitElement, html, ref, createRef, when, map, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { FormItemNumberExtra, FromItemEnumExtra, FromItemMaskExtra, FormItemOtherExtra } from '../base/action.js';

import "../component/input_box.js";
import "../component/select_box.js";
import "../component/check_box.js";
import "../component/toggle_box.js";

class NumberFormItemEditor extends LitElement {
    static properties = {
        _meta: { state: true },
        _model: { state: true },
    };

    constructor() {
        super();
        this._meta = new FormItemNumberExtra();
        this._model = this._meta.min.toString();
    }

    reset(meta, model) {
        this._meta = meta;
        this._model = model;
    }

    _onchange(e) {
        let value = parseInt(e.detail, 10);
        if (value < this._meta.min || value >= this._meta.max) {
            e.preventDefault();
            return;
        }
        this._model = value.toString();
        this.dispatchEvent(new CustomEvent("change", { detail: parseInt(this._model) }));
    }

    render() {
        return html`
        <div style="width: 320px;">
            <input-box value="${this._model}" type="number" @change="${this._onchange}"></input-box>
        </div>
        `;
    }
}
customElements.define("number-form-item-editor", NumberFormItemEditor);

class EnumFormItemEditor extends LitElement {
    static properties = {
        _meta: { state: true },
        _model: { state: true },
    };

    constructor() {
        super();
        this._meta = new FromItemEnumExtra();
        this._model = "";
    }

    reset(meta, model) {
        this._meta = meta;
        this._model = meta.items.find(it => it[1] == model)[0];
    }

    _onchange(e) {
        this._model = e.detail;
        this.dispatchEvent(new CustomEvent("change", { detail: this._meta.items.find(it => it[0] == e.detail)[1] }));
    }

    render() {
        return html`
        <div style="width: 320px;">
            <select-box value="${this._model}" @change="${this._onchange}">
            ${map(this._meta.items, it => html`
            <div data-id="${it[0]}">${it[0]}</div>
            `)}
            </select-box>
        </div>
        `;
    }
}
customElements.define("enum-form-item-editor", EnumFormItemEditor);

class MaskFormItemEditor extends LitElement {
    static properties = {
        _meta: { state: true },
        _model: { state: true },
    };

    constructor() {
        super();
        this._meta = new FromItemMaskExtra();
        this._model = [];
    }

    reset(meta, model) {
        this._meta = meta;
        this._model = meta.items.map(it => (model & it[1]) != 0);
    }

    _onchange(e) {
        this._model[this._meta.items.findIndex(it => it[0] == e.target.dataset["id"])] = e.detail;
        this._model = [...this._model];
        this.dispatchEvent(new CustomEvent("change", { detail: this._meta.items.map((it, index) => this._model[index] ? it[1] : 0).reduce((a, b) => a | b) }));
    }

    render() {
        return html`
        <div>
            ${map(this._meta.items, (it, index) => html`
            <check-box data-id="${it[0]}" ?value="${this._model[index]}" @change="${this._onchange}">
                <span>${it[0]}</span>
            </check-box>
            `)}
        </div>
        `;
    }
}
customElements.define("mask-form-item-editor", MaskFormItemEditor);

class SwitchFormItemEditor extends LitElement {
    static properties = {
        _model: { state: true },
    };

    constructor() {
        super();
        this._model = false;
    }

    reset(meta, model) {
        this._model = model;
    }

    _onchange(e) {
        this._model = !this._model;
        this.dispatchEvent(new CustomEvent("change", { detail: this._model }));
    }

    render() {
        return html`
        <toggle-box ?value="${this._model}" @change="${this._onchange}"></toggle-box>
        `;
    }
}
customElements.define("switch-form-item-editor", SwitchFormItemEditor);

class OtherFormItemEditor extends LitElement {
    static properties = {
        _meta: { state: true },
        _model: { state: true },
    };

    constructor() {
        super();
        this._meta = new FormItemOtherExtra();
        this._model = null;
    }

    editorRef = createRef();

    delayTasks = [];

    reset(meta, model) {
        this._meta = meta;
        this.delayTasks.push(() => {
            this.editorRef.value.reset(meta.extra, model);
        });
        this.requestUpdate();
    }

    _onchange(e) {
        this.dispatchEvent(new CustomEvent("change", { detail: e.detail }));
    }

    render() {
        return html`
        ${when(this._meta.editorName != "", () => this._meta.editor(ref(this.editorRef), this._onchange) ?? nothing, () => nothing)}
        `;
    }

    updated() {
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
    }
}
customElements.define("other-form-item-editor", OtherFormItemEditor);
