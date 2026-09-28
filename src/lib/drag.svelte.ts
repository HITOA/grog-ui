/**
 * Shared state for dragging a subgraph tab onto the flow canvas to instantiate
 * it as a node.
 *
 * This replaces native HTML5 drag & drop (`draggable` + `dataTransfer`), which
 * is unreliable inside the embedded webview host — the OS drag layer isn't
 * wired up, so drags often fail to start and no drag image is shown. Instead we
 * drive the drag with pointer events: the tab bar (drag source) writes the id
 * being dragged here, and the flow canvas (drop target) reads it back on
 * pointerup. The floating ghost also reads {@link x}/{@link y} to follow the
 * cursor.
 */
class SubgraphDrag {
    // Subgraph (tab) index being dragged, or null when nothing is in progress.
    subgraphId: number | null = $state(null);
    // Label shown in the drag ghost.
    label: string = $state("");
    // Whether the pointer has moved past the start threshold. Until then the
    // gesture is still a potential click, so we don't show the ghost or drop.
    active: boolean = $state(false);
    // Current pointer position (viewport coords) for the ghost.
    x: number = $state(0);
    y: number = $state(0);

    /** True once a subgraph is being dragged and movement passed the threshold. */
    get dragging(): boolean {
        return this.subgraphId !== null && this.active;
    }

    /** Arm a potential drag on pointerdown. Not yet {@link active}. */
    arm(subgraphId: number, label: string, x: number, y: number): void {
        this.subgraphId = subgraphId;
        this.label = label;
        this.x = x;
        this.y = y;
        this.active = false;
    }

    /** Update the pointer position and mark the drag live. */
    move(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.active = true;
    }

    /** Clear all drag state (on drop, cancel, or pointerup). */
    reset(): void {
        this.subgraphId = null;
        this.label = "";
        this.active = false;
    }
}

export const subgraphDrag = new SubgraphDrag();
