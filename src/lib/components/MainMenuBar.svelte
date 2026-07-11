<script lang="ts">
    import { compileCurrentGraph } from "$lib/actions";
    import { Button, Menubar } from "bits-ui";

    function onCompileClick() {
        compileCurrentGraph();
    }
</script>

<div class="main-menu-bar-frame">
    <Menubar.Root>

    </Menubar.Root>
    <Button.Root class="compile-button" onclick={onCompileClick}>
        Compile
    </Button.Root>
</div>