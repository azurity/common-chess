import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class CheckBox extends LitElement {
    static properties = {
        value: { type: Boolean },
    };

    static styles = css`
    :host {
        display: flex;
        align-items: center;
        height: 24px;
        font-size: 16px;
        line-height: 24px;
    }
    .button {
        height: 100%;
        aspect-ratio: 1;
        user-select: none;
        cursor: pointer;
    }
    `;

    toggle() {
        this.dispatchEvent(new CustomEvent("change", { detail: !this.value }));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="button" @click="${this.toggle}">
            <span class="material-symbols-outlined">${this.value ? 'check_box': 'check_box_outline_blank'}</span>
        </div>
        <slot></slot>
        `;
    }
}
customElements.define("check-box", CheckBox);