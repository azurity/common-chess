import { Condition, prepareConditionArgs } from "../../script/base/action.js";
import { Entity } from "../../script/base/entity.js";
import { Monitor } from "../../script/base/Monitor.js";
import { Player } from "../../script/base/player.js";

export function posGlobal2Local(range, pos, direct, noOffset) {
    let rangeX = range[0] - 1;
    let rangeY = range[1] - 1;
    if (!!noOffset) {
        rangeX = 0;
        rangeY = 0;
    }
    let x = pos[0];
    let y = pos[1];
    switch (direct) {
        case 1:
            return [x, y];
        case 2:
            return [y, rangeX - x];
        case 3:
            return [rangeX - x, rangeY - y];
        case 4:
            return [rangeY - y, x];
        default:
            return pos;
    }
}

export function posLocal2Global(range, pos, direct, noOffset) {
    let rangeX = range[0] - 1;
    let rangeY = range[1] - 1;
    if (!!noOffset) {
        rangeX = 0;
        rangeY = 0;
    }
    let x = pos[0];
    let y = pos[1];
    switch (direct) {
        case 1:
            return [x, y];
        case 2:
            return [rangeX - y, x];
        case 3:
            return [rangeX - x, rangeY - y];
        case 4:
            return [y, rangeY - x];
        default:
            return pos;
    }
}

Condition.implDict.set("vanilla.x", function (...argList) {
    const owner = Condition.implDict.get("owner");
    return function (ctx) {
        if (argList.length != 1) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        if (!(args[0] instanceof Entity)) {
            return null;
        }
        let globalPos = ctx.board.state.find(it => it[0] == args[0].uuid);
        if (globalPos == undefined) {
            return null;
        }
        globalPos = globalPos[1];
        let direct = owner(args[0])(ctx)?.direct ?? 0;
        if (direct == 0) {
            return null;
        }
        let localPos = posGlobal2Local(ctx.board.size, globalPos, direct);
        return localPos[0];
    }
});
Condition.implDict.get("vanilla.x").doc = "(vanilla.x <piece>)\n" +
    "\treturn the X-axis of piece in piece owner's coordinate system";

Condition.implDict.set("vanilla.y", function (...argList) {
    const owner = Condition.implDict.get("owner");
    return function (ctx) {
        if (argList.length != 1) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        if (!(args[0] instanceof Entity)) {
            return null;
        }
        let globalPos = ctx.board.state.find(it => it[0] == args[0].uuid);
        if (globalPos == undefined) {
            return null;
        }
        globalPos = globalPos[1];
        let direct = owner(args[0])(ctx)?.direct ?? 0;
        if (direct == 0) {
            return null;
        }
        let localPos = posGlobal2Local(ctx.board.size, globalPos, direct);
        return localPos[1];
    }
});
Condition.implDict.get("vanilla.y").doc = "(vanilla.y <piece>)\n" +
    "\treturn the Y-axis of piece in piece owner's coordinate system";

Condition.implDict.set("vanilla.get-piece", function (...argList) {
    function parse(v) {
        if (typeof (v) == 'string') {
            v = JSON.parse(v);
        }
        if (typeof (v) == 'number') {
            return v;
        } else {
            return null;
        }
    }
    return function (ctx) {
        if (argList.length != 3) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        let x = parse(args[0]);
        let y = parse(args[1]);
        if (x == null || y == null) {
            return null;
        }
        if (!(args[2] instanceof Player) || args[2].direct == 0) {
            return null;
        }
        let globalPos = posLocal2Global(ctx.board.size, [x, y], args[2].direct);
        let piece = ctx.board.state.find(it => it[0] == globalPos[0] && it[1] == globalPos[1]) ?? [""];
        return ctx.board.pieces.find(it => it.uuid == piece[0]) ?? null;
    }
});
Condition.implDict.get("vanilla.get-piece").doc = "(vanilla.get-piece <x> <y> <viewer>)\n" +
    "\treturn piece at [x,y] in viewer's coordinate system";

const StepMonitorName = "vanilla.step";

class StepMonitor extends Monitor {
    counters = [];
    constructor() {
        super();
        this.type = StepMonitorName;
    }

    serial() {
        let ret = super.serial();
        ret.counters = JSON.parse(JSON.stringify(this.counters));
        return ret;
    }
    parse(data) {
        super.parse(data);
        this.counters = JSON.parse(JSON.stringify(data.counters));
    }

    step(piece, action) {
        let index = this.counters.findIndex(it => it[0] == piece.uuid);
        if (index == -1) {
            this.counters.push([piece.uuid, 1]);
        } else {
            this.counters[index][1] += 1;
        }
    }
}
Monitor.implDict.push([StepMonitorName, StepMonitor]);

Condition.implDict.set("vanilla.step", function (...argList) {
    return function (ctx) {
        if (argList.length != 1) {
            return null;
        }
        let args = prepareConditionArgs(argList, ctx);
        let aim = args[0];
        if (aim instanceof Entity) {
            let monitor = ctx.board.monitors.find(it => it.type == StepMonitorName);
            return monitor.counters.find(it => it[0] == aim.uuid) ?? 0;
        } else {
            return null;
        }
    }
});
Condition.implDict.get("vanilla.step").doc = "(vanilla.step <piece>)\n" +
    "\treturn the number of steps the piece has moved";

Condition.implDict.set("vanilla.attacker", function (...argList) {
    return function (ctx) {
        if (argList.length != 0) {
            return null;
        }
        return ctx.attacker;
    }
});
Condition.implDict.get("vanilla.attacker").doc = "(vanilla.attacker)\n" +
    "\treturn the piece which attack self";
