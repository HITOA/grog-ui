<script lang="ts">
    import { compileCurrentGraph } from "../actions";
    import { Button, Menubar } from "bits-ui";

    function onCompileClick() {
        compileCurrentGraph();
    }
</script>

<div class="main-menu-bar-frame">
    <svg 
        class="logo" 
        xmlns="http://www.w3.org/2000/svg" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        version="1.1" width="584" height="420" viewBox="622 267 584 420">
            <g stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10">
                <path d="M637,660l95,-140l238,1l127,-239c0,0 87,144 94,390" id="Path-1"/>
            </g>
    </svg>
    <span class="title">GROG</span>
    <Menubar.Root>

    </Menubar.Root>
    <Button.Root class="compile-button" onclick={onCompileClick}>
        <svg width="20px" height="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"/></svg>
        Compile
    </Button.Root>
</div>
<div class="tab">

</div>