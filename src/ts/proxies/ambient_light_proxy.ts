import { MODULE_ID } from "../constants";

/**
 * Proxy type for an AmbientLight object, exposing only the methods used by Outdoor Light.
 * Implementation may vary depending on context (e.g. direct AmbientLight manipulation vs. UI manipulation).
 */
export type AmbientLightProxy = {
    getScene(): Scene;
    /**
     * Gets the bright light radius (aka AmbientLightDocument.config.bright).
     */
    getBright(): number;
    /**
     * Sets the bright light radius (aka AmbientLightDocument.config.bright).
     */
    setBright(bright: number): void;
    /**
     * Gets the dim light radius (aka AmbientLightDocument.config.dim).
     */
    getDim(): number;
    /**
     * Sets the dim light radius (aka AmbientLightDocument.config.dim).
     */
    setDim(dim: number): void;
    /**
     * Sets the hidden state of the light (aka AmbientLightDocument.hidden).
     */
    setHidden(hidden: boolean): void;
    /**
     * Sets the luminosity of the light (aka AmbientLightDocument.config.luminosity).
     */
    setLuminosity(luminosity: number): void;
    /**
     * Sets the maximum darkness level of the light (aka AmbientLightDocument.config.darkness.max).
     */
    setDarknessMax(max: number): void;
    /**
     * Sets the attenuation of the light (aka AmbientLightDocument.config.attenuation).
     */
    setAttenuation(attenuation: number): void;

    /*
     * Gets the levels of the light (aka keys of AmbientLightDocument.levels Set).
     */
    getLevels(): string[];

    /**
     * Sets the levels of the light (aka keys of AmbientLightDocument.levels Set).
     */
    setLevels(levels: string[]): void;

    /**
     * Get emission wall id.
     */
    getEmissionWallId(): string | null;
};

type AmbientLightConfigLike = Pick<
    AmbientLightDocument.Source["config"],
    "bright" | "dim" | "luminosity" | "attenuation"
> & {
    darkness: Pick<
        AmbientLightDocument.Source["config"]["darkness"],
        "max"
    >;
};

type AmbientLightDocumentLike = Pick<
    AmbientLightDocument.Source,
    "hidden" | "flags" | "levels"
> & {
    config: AmbientLightConfigLike;
    parent?: Scene | null;
};

/**
 * Proxy for AmbientLightDocument to implement the AmbientLightProxy interface.
 */
export class AmbientLightDocumentProxy implements AmbientLightProxy {
    protected lightDoc: AmbientLightDocumentLike;
    protected parent: Scene;

    constructor(
        lightDoc: AmbientLightDocumentLike & { parent: Scene }
    );
    constructor(
        lightDoc: AmbientLightDocumentLike,
        parent: Scene
    );
    constructor(
        lightDoc: AmbientLightDocumentLike
    );
    constructor(
        lightDoc: AmbientLightDocumentLike,
        parent?: Scene
    ) {
        this.lightDoc = lightDoc;
        this.parent = parent ?? lightDoc.parent ?? (() => { throw new Error("AmbientLightDocumentProxy requires a parent Scene"); })();
    }

    /**
     * @inheritdoc
     */
    getScene(): Scene {
        return this.parent;
    }

    /**
     * @inheritdoc
     */
    getBright(): number {
        return this.lightDoc.config.bright;
    }

    /**
     * @inheritdoc
     */
    setBright(bright: number) {
        this.lightDoc.config.bright = bright;
    }
    /**
     * @inheritdoc
     */
    setDim(dim: number) {
        this.lightDoc.config.dim = dim;
    }
    /**
     * @inheritdoc
     */
    getDim(): number {
        return this.lightDoc.config.dim;
    }
    /**
     * @inheritdoc
     */
    setHidden(hidden: boolean) {
        this.lightDoc.hidden = hidden;
    }
    /**
     * @inheritdoc
     */
    setLuminosity(luminosity: number) {
        this.lightDoc.config.luminosity = luminosity;
    }
    /**
     * @inheritdoc
     */
    setDarknessMax(max: number) {
        this.lightDoc.config.darkness.max = max;
    }
    /**
     * @inheritdoc
     */
    setAttenuation(attenuation: number) {
        this.lightDoc.config.attenuation = attenuation;
    }


    getLevels(): string[] {
        return this.lightDoc.levels;
    }
    setLevels(levels: string[]): void {
        this.lightDoc.levels = levels;
    }

    /**
     * @inheritdoc
     */
    getEmissionWallId(): string | null {
        return this.lightDoc.flags[MODULE_ID]?.emissionWallId ?? null;
    }
}
