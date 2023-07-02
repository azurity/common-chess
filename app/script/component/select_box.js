import { LitElement, html, css, ref, createRef } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

import "../component/popup_box.js";

class SelectBox extends LitElement {
    static properties = {
        value: { type: String },
    };

    static styles = css`
    .container {
        display: flex;
        width: 100%;
        height: 22px;
        font-size: 16px;
        line-height: 22px;
        border-bottom: 2px dashed rgb(127 127 127 / 0.4);
    }
    .preview {
        flex-grow: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: calc(100% - 22px);
    }
    .button {
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

    .menu {
        width: calc(100% - 2px);
        min-height: 12px;
        font-size: 16px;
        line-height: 24px;
        background-color: white;
        border: 1px solid rgb(127 127 127 / 0.3);
        max-height: calc(25px * 8 + 1px);
        box-sizing: content-box;
        overflow-y: auto;
    }
    .menu > ::slotted(*) {
        height: 24px;
        border-bottom: 1px solid rgb(127 127 127 / 0.2);
        user-select: none;
        cursor: pointer;
    }
    .menu > ::slotted(*:hover) {
        background-color: rgb(127 127 127 / 0.3);
    }
    .menu > ::slotted(*:last-child) {
        border-bottom-color: transparent;
    }
    `;

    menuRef = createRef();

    selectItem(e) {
        let target = e.target;
        while (target.parentElement != this) {
            target = target.parentElement;
        }
        let value = target.dataset["id"];
        if (value != this.value) {
            this.dispatchEvent(new CustomEvent("change", { detail: value }));
        }
        this.menuRef.value.close();
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="container">
            <div class="preview">${this.value}</div>
            <div class="button" @click="${() => { this.menuRef.value.open(); }}">
                <span class="material-symbols-outlined">expand_more</span>
            </div>
        </div>
        <div style="position: relative;">
            <popup-box ${ref(this.menuRef)} local fitWidth style="width: 100%;">
                <div class="menu" @click="${this.selectItem}">
                    <slot></slot>
                </div>
            </popup-box>
        </div>
        `;
    }
}
customElements.define("select-box", SelectBox);