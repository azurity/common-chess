import { LitElement, html, css, ref, createRef } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class InputBox extends LitElement {
    static properties = {
        value: { type: String },
        disabled: { type: Boolean },
        type: { type: String },
    };

    static styles = css`
    :host {
        height: 24px;
        display: flex;
    }
    .container {
        flex-grow: 1;
        box-sizing: border-box;
        width: 100%;
        height: 24px;
        border-bottom: 2px dashed rgb(127 127 127 / 0.4);
        display: flex;
    }
    input {
        border: none;
        outline: none;
    }
    input {
        display: block;
        flex-grow: 1;
        box-sizing: border-box;
        width: 100%;
        height: 22px;
        font-size: 16px;
        line-height: 22px;
    }
    .container:has(input:focus) {
        border-bottom-style: solid;
    }
    /* input[disabled] {
        border-bottom: 2px dashed transparent;
    } */
    slot {
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        cursor: pointer;
    }
    slot:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    `;

    inputRef = createRef();

    onchange(e) {
        if (!this.dispatchEvent(new CustomEvent("change", { 
            detail: e.target.value,
            cancelable: true,
        }))) {
            e.target.value = this.value;
        }
    }

    onblur(e) {
        this.dispatchEvent(new CustomEvent("blur", {}));
    }

    delayTasks = [];

    focus() {
        this.delayTasks.push(() => {
            if (this.inputRef.value)
                this.inputRef.value.focus();
        });
    }

    render() {
        return html`
        <slot name="prepend"></slot>
        <div class="container">
            <slot name="prepend-inner"></slot>
            <input ${ref(this.inputRef)} ?disabled="${this.disabled}" type="${this.type}" value="${this.value}" @change="${this.onchange}" @blur="${this.onblur}">
            <slot name="append-inner"></slot>
        </div>
        <slot name="append"></slot>
        `;
    }

    updated() {
        if (this.inputRef.value.value != this.value) {
            this.inputRef.value.value = this.value;
        }
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
    }
}
customElements.define("input-box", InputBox);
