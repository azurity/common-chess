import { LitElement, html, css, ref, createRef, repeat } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

class SortableList extends LitElement {
    static styles = css`
    :host {
        height: 100%;
        overflow: hidden;
    }
    `;

    static properties = {
        currentSource: { type: String },
        currentTarget: { type: String },
    };

    list = [];

    refresh(list) {
        this.list = list;
    }

    get items() {
        return [...this.querySelectorAll("sortable-item")];
    }

    firstUpdated() {
        this.addEventListener('dragover', e => e.preventDefault());
        this.addEventListener("currentTarget", e => this.setCurrentTarget(e));
        this.addEventListener("currentSource", e => this.setCurrentSource(e));
        this.addEventListener("complete", e => this.setComplete(e));
    };

    render() {
        return html`
        <slot></slot>
        `;
    }

    sort() {
        let indexMap = new Map(this.list.map((it, i) => [it, i]));

        const sorted = this.items
            .filter(it => indexMap.has(it.dataset["id"]))
            .map(it => [it, indexMap.get(it.dataset["id"])])
            .sort((a, b) => a[1] - b[1]).map(it => it[0]);

        this.items.map(it => this.removeChild(it));
        sorted.map(it => {
            this.appendChild(it);
        });
    }

    setCurrentTarget(e) {
        this.currentTarget = e.detail.id;
        let sourceIndex = this.list.findIndex(it => it == this.currentSource);
        let targetIndex = this.list.findIndex(it => it == this.currentTarget);
        let offset = targetIndex > sourceIndex ? 1 : 0;
        let cutted = this.list.splice(sourceIndex, 1);
        this.list.splice(this.list.findIndex(it => it == this.currentTarget) + offset, 0, ...cutted);
        this.sort();
    }

    setCurrentSource(e) {
        this.items.map(it => {
            it.currentSource = e.detail.id;
        });
        this.currentSource = e.detail.id;
    }

    setComplete(e) {
        this.items.map(it => {
            e.currentSource = null;
        });
        this.dispatchEvent(new CustomEvent("sorted", { detail: this.list }));
    }
}
customElements.define("sortable-list", SortableList);

class SortableItem extends LitElement {
    static properties = {
        currentSource: { type: String },
    };

    firstUpdated() {
        this.setAttribute('draggable', 'true');
        const events = ['dragstart', 'dragover', 'dragend'];
        events.map(e => this.addEventListener(e, ev => this[e](ev), false));
    }

    render() {
        const isSource = this.currentSource == this.dataset["id"];

        return html`
        <style>
            :host {
                opacity: ${isSource ? '50%' : '100%'},
            }
        </style>
        <slot></slot>
        `;
    }

    dragstart(e) {
        this.dispatchEvent(new CustomEvent("currentSource", {
            detail: {
                id: this.dataset["id"],
            },
            bubbles: true,
            composed: true,
        }));
    }

    dragover(e) {
        e.preventDefault();
        if (this.currentSource == this.dataset["id"]) {
            return;
        }
        this.dispatchEvent(new CustomEvent("currentTarget", {
            detail: {
                id: this.dataset["id"],
            },
            bubbles: true,
            composed: true,
        }));
    }

    dragend(e) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent("complete", {
            bubbles: true,
            composed: true,
        }));
    }
}
customElements.define("sortable-item", SortableItem);

class CommonList extends LitElement {
    static properties = {
        titleText: { type: String },
        selectable: { type: Boolean },
        _items: { state: true },
        _select: { state: true },
    };

    static styles = css`
    .title-bar {
        box-sizing: border-box;
        border: 4px dashed rgb(127 127 127 / 0.4);
        height: 32px;
        line-height: 24px;
        font-size: 20px;
        padding-left: 8px;
        display: flex;
    }
    .add-button {
        margin: 8px;
        border: 4px dashed rgb(127 127 127 / 0.4);
        height: 32px;
        line-height: 24px;
        font-size: 24px;
        user-select: none;
        cursor: pointer;
    }
    .container {
        background-color: rgb(127 127 127 / 0.1);
        height: calc(100% - 32px);
        overflow-x: hidden;
        overflow-y: scroll;
    }
    .item {
        box-sizing: border-box;
        user-select: none;
        margin: 8px;
        width: calc(100% - 16px);
        background-color: rgb(127 127 127 / 0.2);
        display: flex;
    }
    .item-button {
        width: 32px;
        height: 32px;
        user-select: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .item-button:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .item-name {
        flex-grow: 1;
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: calc(100% - 64px);
        cursor: pointer;
    }
    .item-name:hover {
        background-color: rgb(127 127 127 / 0.2);
    }
    .item.select {
        box-shadow: inset 0 0 2px black;
    }
    `;

    listRef = createRef();
    sortable = null;

    delayTasks = [];

    constructor() {
        super();
        this._items = [];
        this._select = "";
    }

    setItems(items) {
        this._items = items;
        this.delayTasks.push(() => {
            this.listRef.value.list = this.uuidList();
        });
    }

    uuidList() {
        return this._items.map(it => it.uuid);
    }

    sorted(e) {
        this.updateItems(e.detail);
    }

    updateItems(uuids) {
        this.dispatchEvent(new CustomEvent("update", { detail: uuids }));
    }

    removeItem(e) {
        const uuid = e.currentTarget.parentElement.dataset["id"];
        if (uuid == this._select && this.selectable) {
            this._select = "";
            this.dispatchEvent(new CustomEvent("select", { detail: "" }));
        }
        this.updateItems(this.uuidList().filter(it => it != uuid));
    }

    selectItem(e) {
        const uuid = e.currentTarget.parentElement.dataset["id"];
        if (this.selectable) {
            this._select = uuid;
        }
        this.dispatchEvent(new CustomEvent("select", { detail: uuid }));
    }

    render() {
        return html`
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0" />
        <div class="title-bar">
            <div style="flex-grow: 1;">${this.titleText}</div>
            <slot name="add"></slot>
        </div>
        <div class="container">
            <sortable-list ${ref(this.listRef)} @sorted="${this.sorted}">
                ${repeat(this._items, it => it.uuid, it => html`
                    <sortable-item data-id="${it.uuid}">
                    <div class="item ${it.uuid == this._select && this.selectable ? 'select' : ''}" data-id="${it.uuid}">
                        <div class="handle item-button">
                            <span class="material-symbols-outlined">menu</span>
                        </div>
                        <div class="item-name" title="${it.name}" @click="${this.selectItem}">${it.name}</div>
                        <div class="item-button" @click="${this.removeItem}">
                            <span class="material-symbols-outlined">close</span>
                        </div>
                    </div>
                    </sortable-item>
                `)}
            </sortable-list>
        </div>
        `;
    }

    updated() {
        for (let it of this.delayTasks) {
            it();
        }
        this.delayTasks = [];
        if (this.listRef.value != null)
            this.listRef.value.sort();
    }
}
customElements.define("common-list", CommonList);
