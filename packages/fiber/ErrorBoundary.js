import { noop, get } from "react-core/util";
import { Renderer } from "react-core/createRenderer";
import { fakeObject } from "react-core/Component";
import { NOWORK, CAPTURE, DETACH, NULLREF } from "./effectTag";

export function pushError(fiber, hook, error) {
    let names = [];
    let root = findCatchComponent(fiber, names);
    let stack = describeError(names, hook);
    let boundary = root.catchBoundary;
    if (boundary) {
        fiber.effectTag = NOWORK;
        var inst = fiber.stateNode;
        if (inst && inst.updater && inst.updater.isMounted()) {
            //已经插入
        } else {
            fiber.stateNode = {
                updater: fakeObject,
            };
        }

        if (!boundary.capturedCount) {
            boundary.capturedCount = 1;
        }

        boundary.effectTag *= CAPTURE;
        root.capturedValues.push(error, {
            componentStack: stack
        });

    } else {

        var p = fiber.return;
        for (var i in p._children) {
            if (p._children[i] == fiber) {
                fiber.type = noop;
            }
        }
        while (p) {
            p._hydrating = false;
            p = p.return;
        }
        if (!Renderer.catchError) {
            Renderer.catchError = error;
        }
    }
}


export function guardCallback(host, hook, args) {
    try {
        return applyCallback(host, hook, args);
    } catch (error) {
        pushError(get(host), hook, error);
    }
}

export function applyCallback(host, hook, args) {
    var fiber = host._reactInternalFiber;
    fiber.errorHook = hook;
    let fn = host[hook];
    if (hook == "componentWillUnmount") {
        host[hook] = noop;
    }
    if (fn) {
        return fn.apply(host, args);
    }
    return true;
}
function describeError(names, hook) {
    let segments = [`**${hook}** method occur error `];
    names.forEach(function (name, i) {
        if (names[i + 1]) {
            segments.push("in " + name + " (created By " + names[i + 1] + ")");
        }
    });
    return segments.join("\n").trim();
}


function findCatchComponent(fiber, names) {
    let instance,
        name,
        topFiber = fiber,
        boundary;
    while (fiber) {
        name = fiber.name;
        if (fiber.tag < 4) {
            names.push(name);
            instance = fiber.stateNode || {};
            if (instance.componentDidCatch && !boundary) {
                //boundary不能等于出错组件，不能已经处理过错误
                if (!fiber.capturedCount && topFiber !== fiber) {
                    boundary = fiber;
                } else if (fiber.capturedCount) {
                    fiber.effectTag = DETACH;
                    fiber.disposed = true; //防止再次实例化
                }
            }
        } else if (fiber.tag === 5) {
            names.push(name);
        }
        if (fiber.return) {
            fiber = fiber.return;
        } else {
            if (boundary) {
                fiber.catchBoundary = boundary;
            }
            return fiber;
        }

    }
}


export function detachFiber(fiber, effects) {
    fiber.effectTag = DETACH;
    fiber.disposed = true;
    effects.push(fiber);
    if (fiber.ref && fiber.stateNode && fiber.stateNode.parentNode) {
        fiber.effectTag *= NULLREF;
    }
    for (let child = fiber.child; child; child = child.sibling) {
        detachFiber(child, effects);
    }
}
