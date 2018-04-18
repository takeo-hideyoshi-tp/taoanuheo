import { emptyObject } from "react-core/util";

export const ownerStack = [];
export const effects = [];
export const batchedqueue = [];
export const containerStack = [];
export const contextStack = [emptyObject];
export function resetStack() {
    containerStack.length = contextStack.length = 0;
    contextStack.push(emptyObject);
}
export function hasContextChanged() {
    return contextStack[0] != emptyObject;
}
