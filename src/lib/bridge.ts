interface PendingRequest<T = unknown> {
    resolve: (value: T) => void;
    reject: (reason: Error) => void;
}

let requestId = 0;
const pendingRequests = new Map<number, PendingRequest<any>>();

interface OutgoingMessage {
    id: number;
    type: string;
    [key: string]: unknown;
}

interface IncomingMessage {
    id?: number;
    type?: string;
    data?: unknown;
    error?: string;
}

export function callNative<TResponse = unknown>(type: string, payload: Record<string, unknown> = {}, timeout_delay: number = 5000) {
    return new Promise<TResponse>((resolve, reject) => {
        const id = requestId++;
        const timeout = setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                reject(new Error(`Native call "${type}" timed out`));
            }
        }, timeout_delay);
        pendingRequests.set(id, { 
            resolve: (value: TResponse) => { clearTimeout(timeout); resolve(value); }, 
            reject: (err: Error) => { clearTimeout(timeout); reject(err); }
        });

        const message: OutgoingMessage = { id, type, ...payload }
        window.postMessage(JSON.stringify(message));
    });
}

function onNativeMessage(data: unknown): void {
    const msg: IncomingMessage = data as IncomingMessage;

    if ("id" in msg && msg.id !== undefined && pendingRequests.has(msg.id)) {
        const pending = pendingRequests.get(msg.id);
        pendingRequests.delete(msg.id);

        if (msg.error)
            pending?.reject(new Error(msg.error))
        else if (!("data" in msg))
            pending?.resolve(void(0));
        else
            pending?.resolve(msg.data)

    } else if ("type" in msg && msg.type !== undefined) {
        const event = new CustomEvent(msg.type, {
            detail: {
                data: msg.data,
                error: msg.error
            }
        });
        window.dispatchEvent(event);
    }
}

declare global {
    interface Window {
        pushNativeMessage: (data: JSON) => void;
    }
}

window.pushNativeMessage = onNativeMessage;