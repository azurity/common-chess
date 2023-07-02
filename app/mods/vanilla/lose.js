import { ActionInfo, Action, FormItemType, FormItem, FromItemMaskExtra, FormItemNumberExtra, FormItemOtherExtra } from "../../script/base/action.js";
import { Nation } from "../../script/base/nation.js";

const LoseActionName = "vanilla.lose";
export const LoseSymbol = Symbol("lose");

export class LoseAction extends Action {
    constructor() {
        super();
        this.type = LoseActionName;
    }

    step(board, state, piece) {
        const owner = (() => {
            for (let it of board.nations) {
                let queue = [...it.sub];
                while (queue.length > 0) {
                    if (queue[0].uuid == piece.uuid) {
                        return board.players.find(p => p.uuid == it.monarch) ?? null;
                    }
                    if (queue[0] instanceof Nation) {
                        queue.push(...queue[0].sub);
                    }
                    queue = queue.slice(1);
                }
            }
            return null;
        })();
        if (owner == null) {
            return [[], []];
        }
        return [[[...state.map(it => [...it]), [LoseSymbol, owner.user]]], [[]]];
    }
}

let info = new ActionInfo();
info.Class = LoseAction;
info.items = [];
Action.implDict.set(LoseActionName, info);
