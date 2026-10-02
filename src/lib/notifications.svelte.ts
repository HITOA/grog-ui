// Notifications: short messages shown over the editor, for anything the user
// must notice now (the console keeps the full log). A notification may carry
// actions, and stays until dismissed when it's sticky.

export type NotificationLevel = "info" | "warning" | "error";

export interface NotificationAction {
    label: string;
    run: () => void;
}

export interface NotificationOptions {
    level: NotificationLevel;
    title: string;
    message?: string;
    actions?: NotificationAction[];
    // Stays until dismissed; otherwise it goes away after `timeout` ms.
    sticky?: boolean;
    timeout?: number;
    // A new notification with the same key replaces the shown one, so a
    // repeated event doesn't stack up.
    key?: string;
}

export interface Notification {
    id: number;
    level: NotificationLevel;
    title: string;
    message?: string;
    actions: NotificationAction[];
    sticky: boolean;
    key?: string;
}

const DEFAULT_TIMEOUT_MS = 6000;

class NotificationCenter {
    items: Notification[] = $state([]);

    private nextId = 1;
    private timers = new Map<number, ReturnType<typeof setTimeout>>();

    /** Shows a notification; returns its id. */
    notify(options: NotificationOptions): number {
        if (options.key !== undefined) this.dismissKey(options.key);
        const notification: Notification = {
            id: this.nextId++,
            level: options.level,
            title: options.title,
            message: options.message,
            actions: options.actions ?? [],
            sticky: options.sticky ?? false,
            key: options.key,
        };
        this.items = [...this.items, notification];
        if (!notification.sticky) {
            const timer = setTimeout(() => this.dismiss(notification.id), options.timeout ?? DEFAULT_TIMEOUT_MS);
            this.timers.set(notification.id, timer);
        }
        return notification.id;
    }

    dismiss(id: number): void {
        const timer = this.timers.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.items = this.items.filter((item) => item.id !== id);
    }

    /** Dismisses the notification shown under `key`, if any. */
    dismissKey(key: string): void {
        for (const item of this.items) if (item.key === key) this.dismiss(item.id);
    }
}

export const notifications = new NotificationCenter();
