import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class ToggleBox extends LitElement {
    static properties = {
        value: { type: Boolean },
    };

    static styles = css`
    :host > div {
        display: flex;
        align-items: center;
        height: 24px;
        font-size: 16px;
        line-height: 24px;
        user-select: none;
        cursor: pointer;
    }
    .button {
        height: 100%;
        aspect-ratio: 1;
        user-select: none;
    }
    `;

    toggle() {
        this.dispatchEvent(new CustomEvent("change", { detail: !this.value }));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div style="${this.value ? 'color: green' : 'gray'}" @click="${this.toggle}">
            <div class="button">
                <span class="material-symbols-outlined">${this.value ? 'toggle_on' : 'toggle_off'}</span>
            </div>
            <span style="font-weight: bold;">${this.value ? 'ON' : 'OFF'}</span>
        </div>
        `;
    }
}
customElements.define("toggle-box", ToggleBox);