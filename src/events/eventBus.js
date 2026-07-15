import { EventEmitter } from "events";

// Central event bus so order creation, inventory updates, emails, and
// notifications stay decoupled (swap for BullMQ later without touching callers).
export const eventBus = new EventEmitter();

export const emitEvent = (eventName, payload) => eventBus.emit(eventName, payload);
export const onEvent = (eventName, handler) => eventBus.on(eventName, handler);
