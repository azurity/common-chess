export class Monitor {
    board = null;
    type = "";
    static implDict = [];
    constructor(board) {
        this.board = board;
    }
    init() { }
    step(piece, action) { }
    serial() {
        return {
            type: this.type,
        };
    }
    parse(data) {
        this.type = data.type;
    }
}
