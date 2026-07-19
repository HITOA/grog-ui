import { PortState, type Pair, type PortInstance } from "../../types";

export enum PortColorVar {
    Color0,
    Color1,
    Color2,
    Unresolved
}

export enum PortShape {
    Circle,
    Sin,
    DoubleSin
}

const shapes: Map<PortShape, Pair<string, string>> = new Map<PortShape, Pair<string, string>>();
shapes.set(PortShape.Circle, {
    first: "handle-default-icon-d.svg",
    second: "handle-default-icon-c.svg"
});
shapes.set(PortShape.Sin, {
    first: "handle-mono-icon-d.svg",
    second: "handle-mono-icon-c.svg"
});
shapes.set(PortShape.DoubleSin, {
    first: "handle-stereo-icon-d.svg",
    second: "handle-stereo-icon-c.svg"
});
shapes.forEach(async (pair) => { // Lazy & ugly code
    pair.first = await (await fetch(pair.first)).text();
    pair.second = await (await fetch(pair.second)).text();
});

const colors: Map<PortColorVar, string> = new Map<PortColorVar, string>();
colors.set(PortColorVar.Color0, "--port-color-0");
colors.set(PortColorVar.Color1, "--port-color-1");
colors.set(PortColorVar.Color2, "--port-color-2");
colors.set(PortColorVar.Unresolved, "--port-unresolved");

export class PortStyle {
    portColor: PortColorVar = PortColorVar.Color0;
    portShape: PortShape = PortShape.Circle;

    static PORT_STYLE_CV: PortStyle = new PortStyle(PortColorVar.Color0, PortShape.Circle);
    static PORT_STYLE_AUDIO_MONO: PortStyle = new PortStyle(PortColorVar.Color1, PortShape.Sin);
    static PORT_STYLE_AUDIO_STEREO: PortStyle = new PortStyle(PortColorVar.Color1, PortShape.DoubleSin);
    static PORT_STYLE_OTHER: PortStyle = new PortStyle(PortColorVar.Color2, PortShape.Circle);
    static PORT_STYLE_UNRESOLVED: PortStyle = new PortStyle(PortColorVar.Unresolved, PortShape.Circle);

    constructor(portColor: PortColorVar, portShape: PortShape) {
        this.portColor = portColor;
        this.portShape = portShape;
    }

    get shape(): Pair<string, string> | undefined {
        return shapes.get(this.portShape);
    }

    get color(): string | undefined {
        return colors.get(this.portColor);
    }

    clone(): PortStyle {
        return new PortStyle(this.portColor, this.portShape);
    }

    static getStyle(instance: PortInstance | undefined): PortStyle {
        if (instance == undefined)
            return PortStyle.PORT_STYLE_UNRESOLVED.clone();
        let style: PortStyle = PortStyle.PORT_STYLE_UNRESOLVED.clone();
        switch (instance.type.commonName) {
            case "Builtin_Numeric": {
                style = PortStyle.PORT_STYLE_CV.clone();
                break;
            }
            case "Builtin_Control": {
                style = PortStyle.PORT_STYLE_CV.clone();
                break;
            }
            case "Builtin_AudioMono": {
                style = PortStyle.PORT_STYLE_AUDIO_MONO.clone();
                break;
            }
            case "Builtin_AudioStereo": {
                style = PortStyle.PORT_STYLE_AUDIO_STEREO.clone();
                break;
            }
            default: {
                style = PortStyle.PORT_STYLE_OTHER.clone()
                break;
            }
        }

        if (instance.state == PortState.Unresolved) {
            style.portColor = PortColorVar.Unresolved;
        }
        return style;
    }
}