import { EventEmitter } from "node:events";

type Payload = Record<string, unknown>;

const bus = new EventEmitter();
bus.setMaxListeners(200);

export function emitProgress(nodeId: string, event: string, data: Payload) {
  bus.emit(`node:${nodeId}`, { event, data });
}

export function subscribeProgress(
  nodeId: string,
  handler: (msg: { event: string; data: Payload }) => void,
) {
  const channel = `node:${nodeId}`;
  bus.on(channel, handler);
  return () => bus.off(channel, handler);
}
