/**
 * Bundled plugins, delivered as source text so they load through the same path
 * a user- or native-supplied plugin would (source string -> worker -> module).
 *
 * `?raw` imports the file's contents as a string at build time (a Vite feature;
 * see `vite/client` types). To ship more built-ins, add another `?raw` import.
 * Eventually this list would be replaced/augmented by sources fetched from the
 * native host (e.g. an `API.getPluginList()` / `API.getPluginSource()` pair).
 */

import autoArrangeSource from "./auto-arrange.js?raw";

export interface BuiltinPlugin {
    id: string;
    source: string;
}

export const builtinPlugins: BuiltinPlugin[] = [{ id: "auto-arrange", source: autoArrangeSource }];
