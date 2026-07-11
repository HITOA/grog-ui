export function setTheme(name: string): void {
    const preload = document.createElement("link");
    preload.rel = 'stylesheet';
    preload.href = `./themes/${name}.css`;
    preload.onload = () => {
        document.getElementById("theme-stylesheet")?.remove();
        preload.id = "theme-stylesheet";
    }
    document.head.appendChild(preload);
}