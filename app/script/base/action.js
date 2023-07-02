import { html } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
import { NIL as NIL_UUID, v4 as UUIDv4 } from 'https://cdn.jsdelivr.net/npm/uuid@9.0.0/+esm';
import { Nation } from './nation.js';
import { Entity } from './entity.js';

export class Action {
    name = "unnamed action";
    type = "";
    uuid = NIL_UUID;
    static implDict = new Map();
    serial() {
        return {
            name: this.name,
            type: this.type,
            uuid: this.uuid,
        };
    }
    parse(data) {
        this.name = data.name;
        this.type = data.type;
        this.uuid = data.uuid;
    }
    reID() {
        this.uuid = UUIDv4();
    }
    step(board, state, piece) {
        // const board, const state
        return [[], []]; // new states, desc-lists
    }
}

export class ActionInfo {
    Class = Action;
    items = [];
}

export const FormItemType = {
    number: 0,
    enum: 1,
    mask: 2,
    switch: 3,
    other: 4,
};

export class FormItemNumberExtra {
    min = 0;
    max = Infinity;
}

export class FromItemEnumExtra {
    items = []; // [[name, value], ...]
}

export class FromItemMaskExtra {
    items = []; // [[name, value], ...]
}

export class FormItemOtherExtra {
    editor = (ref, onchange) => { return null; };
    extra = null;
}

export class FormItem {
    name = "";
    propName = "";
    type = FormItemType.number;
    extra = {};
}

function conditionGenerate(code, index) {
    if (index >= code.length) {
        return null;
    }
    if (code[index] == '(') {
        let items = [];
        let newIndex = index + 1;
        while (true) {
            if (newIndex >= code.length) {
                return null;
            }
            if (code[newIndex] == ')') {
                newIndex += 1;
                break;
            }
            if (/[ \t\n]/.test(code[newIndex])) {
                newIndex += 1;
                continue;
            }
            let sub = conditionGenerate(code, newIndex);
            if (sub == null) {
                return null;
            }
            newIndex = sub[1];
            items.push(sub[0]);
        }
        if (items.length == 0) {
            return null;
        }
        return [`Condition.implDict.get(${items[0]})(${items.slice(1).join(',')})`, newIndex];
    } else if (code[index] == '"') {
        for (let i = index + 1; i < code.length; i++) {
            if (code[i] == '"') {
                return [code.substring(index, i), i];
            } else if (code[i] == '\\') {
                i += 1;
            }
        }
        return null;
    } else {
        for (let i = index; i < code.length; i++) {
            if (/[ \t\n\(\)$]/.test(code[i])) {
                return [JSON.stringify(code.substring(index, i)), i];
            }
        }
    }
}

export class Condition extends Action {
    code = "";
    fn = null;
    static implDict = new Map();
    constructor() {
        super();
        this.name = "unnamed condition";
        this.type = "condition";
    }
    serial() {
        let ret = super.serial();
        ret.code = this.code;
        return ret;
    }
    parse(data) {
        super.parse(data);
        this.code = data.code;
        let fnBody = conditionGenerate(this.code, 0);
        if (fnBody != null && fnBody[1] == this.code.length) {
            this.fn = eval(fnBody[0]);
        }
    }
}

let conditionFormCode = new FormItem();
conditionFormCode.name = "condition code";
conditionFormCode.propName = "code";
conditionFormCode.type = FormItemType.other;
conditionFormCode.extra = new FormItemOtherExtra();
conditionFormCode.extra.editor = (ref, onchange) => html`<condition-code-editor ${ref} @change="${onchange}"></condition-code-editor>`;
conditionFormCode.extra.extra = null;

let conditionInfo = new ActionInfo();
conditionInfo.Class = Condition;
conditionInfo.items = [conditionFormCode];

Action.implDict.set("condition", conditionInfo);

export function prepareConditionArgs(args, ctx) {
    return args.map(it => {
        return it instanceof Function ? it(ctx) : it;
    });
}

Condition.implDict.set("and", function (...args) {
    return function (ctx) {
        for (let it of args) {
            if (it instanceof Function) {
                let value = it(ctx);
                if (!value) {
                    return false;
                }
            } else if (typeof(it) == 'string') {
                let value = JSON.parse(it);
                if (!value) {
                    return false;
                }
            } else if (!it) {
                return false;
            }
        }
    };
});
Condition.implDict.get("and").doc = "(and <cond> ...)\n" +
    "\tlogic and";

Condition.implDict.set("or", function (...args) {
    return function (ctx) {
        for (let it of args) {
            if (it instanceof Function) {
                let value = it(ctx);
                if (!!value) {
                    return true;
                }
            } else if (typeof(it) == 'string') {
                let value = JSON.parse(it);
                if (!!value) {
                    return true;
                }
            } else if (!!value) {
                return true;
            }
        }
    };
});
Condition.implDict.get("or").doc = "(or <cond> ...)\n" +
    "\tlogic or";

Condition.implDict.set("not", function (...args) {
    return function (ctx) {
        if (args.length != 1) {
            return null;
        }
        let it = args[0];
        if (it instanceof Function) {
            let value = it(ctx);
            return !value;
        } else if (typeof(it) == 'string') {
            let value = JSON.parse(it);
            return !value;
        } else {
            return !value;
        }
    };
});
Condition.implDict.get("not").doc = "(not <cond>)\n" +
    "\tlogic not";

Condition.implDict.set("xor", function (...args) {
    return function (ctx) {
        if (args.length != 2) {
            return null;
        }
        const proc = function (it) {
            if (it instanceof Function) {
                let value = it(ctx);
                return !!value;
            } else if (typeof(it) == 'string') {
                let value = JSON.parse(it);
                return !!value;
            } else {
                return !!value;
            }
        }
        return proc(args[0]) != proc(args[1]);
    };
});
Condition.implDict.get("xor").doc = "(not <cond1> <cond2>)\n" +
    "\tlogic xor";

Condition.implDict.set("eq", function (...argList) {
    return function (ctx) {
        if (argList.length != 2) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        return args[0] == args[1];
    };
});
Condition.implDict.get("eq").doc = "(eq <value1> <value2>)\n" +
    "\ttest equal";

Condition.implDict.set("neq", function (...argList) {
    return function (ctx) {
        if (argList.length != 2) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        return args[0] != args[1];
    };
});
Condition.implDict.get("neq").doc = "(neq <value1> <value2>)\n" +
    "\ttest not equal";

Condition.implDict.set("is-null", function (...argList) {
    return function (ctx) {
        if (argList.length != 1) {
            return false;
        }
        let args = prepareConditionArgs(argList, ctx);
        return args[0] == null;
    };
});
Condition.implDict.get("is-null").doc = "(is-null <value>)\n" +
    "\ttest is null";

Condition.implDict.set("self", function (...args) {
    return function (ctx) {
        if (args.length != 0) {
            return null;
        }
        return ctx.self;
    };
});
Condition.implDict.get("self").doc = "(self)\n" +
    "\treturn this piece";

Condition.implDict.set("owner", function (...argList) {
    return function (ctx) {
        if (argList.length != 1) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        if (!(args[0] instanceof Entity)) {
            return null;
        }
        for (let it of ctx.board.nations) {
            let queue = [...it.sub];
            while (queue.length > 0) {
                if (queue[0].uuid == args[0].uuid) {
                    return ctx.board.players.find(p => p.uuid == it.monarch) ?? null;
                }
                if (queue[0] instanceof Nation) {
                    queue.push(...queue[0].sub);
                }
                queue = queue.slice(1);
            }
        }
        return null;
    }
});
Condition.implDict.get("owner").doc = "(owner <piece>)\n" +
    "\treturn the owner player of piece";

Condition.implDict.set("me", function (...args) {
    return Condition.implDict.get("owner")(Condition.implDict.get("self")());
});
Condition.implDict.get("me").doc = "(me)\n" +
    "\talias of `(owner (self))`";
