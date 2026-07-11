import { PortState, type PortInstance } from "../../types";

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

const shapes: Map<PortShape, string> = new Map<PortShape, string>();
shapes.set(PortShape.Circle, "M192 320C192 249.3 249.3 192 320 192 390.7 192 448 249.3 448 320 448 390.7 390.7 448 320 448 249.3 448 192 390.7 192 320z");
shapes.set(PortShape.Sin, "M64 320c67.5-118.125 123.75-118.125 191.25 0s123.75 118.125 189 5.25c6.75-15 33.75-20.25 0 37.5-65.25 112.875-121.5 112.875-189-5.25S131.5 239.375 64 357.5c-9.75 16.5-31.5 15 0-37.5")
shapes.set(PortShape.DoubleSin, "M64 320c67.5-118.125 123.75-118.125 191.25 0s123.75 118.125 189 5.25c6.75-15 33.75-20.25 0 37.5-65.25 112.875-121.5 112.875-189-5.25S131.5 239.375 64 357.5c-9.75 16.5-31.5 15 0-37.5")

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

    get path(): string | undefined {
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