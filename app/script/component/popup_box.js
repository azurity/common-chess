import { LitElement, html, css, ref, createRef } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class PopupBox extends LitElement {
    static properties = {
        fitWidth: { type: Boolean },
        local: { type: Boolean },
        backdrop: { type: Boolean },
        hold: { type: Boolean },
    };

    static styles = css`
    :host {
        position: absolute;
        width: 100%;
    }
    dialog {
        max-width: unset;
        max-height: unset;
        padding: 0;
        border: none;
        outline: none;
        background-color: transparent;
    }
    dialog.local {
        margin: 0;
        position: absolute;
    }
    dialog.nobackdrop::backdrop {
        background-color: transparent;
    }
    dialog.fitWidth {
        margin: 0;
    }
    dialog.fitWidth > * {
        width: 100%;
    }
    `;

    dialog = createRef();

    open() {
        if (this.local) {
            let boundary = this.getBoundingClientRect();
            this.dialog.value.style.left = `${boundary.left}px`;
            this.dialog.value.style.top = `${boundary.top}px`;
        }
        if (this.fitWidth) {
            this.dialog.value.style.width = `${this.offsetWidth}px`;
        }
        this.dialog.value.showModal();
    }

    close() {
        this.dialog.value.close();
        this.dispatchEvent(new CustomEvent("windowHide"));
    }

    render() {
        return html`
        <dialog class="${[this.local ? 'local' : '', this.backdrop ? '' : 'nobackdrop', this.fitWidth ? 'fitWidth' : ''].join(' ')}" ${ref(this.dialog)} @click="${(e) => { if (!this.hold) { this.close(); } e.stopPropagation(); }}">
            <div @click="${(e) => { e.stopPropagation(); }}">
                <slot></slot>
            </div>
        </dialog>
        `;
    }
}
customElements.define("popup-box", PopupBox);
