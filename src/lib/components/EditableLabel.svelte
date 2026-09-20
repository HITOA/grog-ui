<script lang="ts">
    import type { HTMLAttributes } from "svelte/elements";

    // `others` is spread onto both an <input> and a <span>, so use the attribute
    // set common to all HTML elements.
    interface Props extends HTMLAttributes<HTMLElement> {
        editable?: boolean;
        onedit?: (value: string) => void;
        value: string;
    }

    let { editable = $bindable(false), onedit, value, ...others }: Props = $props();

    let ref: HTMLInputElement | undefined = $state();
    let lastEditable = false;
    let editedValue: string = $state("");

    $effect(() => {
        ref?.focus();
    });

    $effect(() => {
        if (editable && editable != lastEditable) {
            lastEditable = editable;
        } else if (!editable && editable != lastEditable) {
            lastEditable = editable;
            if (onedit) onedit(editedValue);
        }
    });

    function onDoubleClickLabel() {
        editable = true;
    }

    function onFocusIn() {
        editedValue = value;
    }

    function onFocusOut() {
        editable = false;
    }

    function onKeyUp(ev: KeyboardEvent) {
        if (ev.key === "Enter") {
            editable = false;
        }
    }
</script>

{#if editable}
    <input
        {...others}
        bind:value={editedValue}
        onfocusin={onFocusIn}
        onfocusout={onFocusOut}
        onkeyup={onKeyUp}
        bind:this={ref}
    />
{:else}
    <span {...others} ondblclick={onDoubleClickLabel}>
        {value}
    </span>
{/if}
