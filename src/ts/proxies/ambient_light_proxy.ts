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

    /**
     * Get emission wall id.
     */
    getEmissionWallId(): string | null;
};

/**
 * Type alias for AmbientLightDocument with a guaranteed non-null parent Scene.
 */
export type AmbientLightDocWithParent = AmbientLightDocument & { parent: NonNullable<AmbientLightDocument["parent"]> };
/**
 * Proxy for AmbientLightDocument to implement the AmbientLightProxy interface.
 */
export class AmbientLightDocumentProxy implements AmbientLightProxy {
    constructor(protected lightDoc: AmbientLightDocWithParent) { }

    /**
     * @inheritdoc
     */
    getScene(): Scene {
        return this.lightDoc.parent;
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

    /**
     * @inheritdoc
     */
    getEmissionWallId(): string | null {
        return this.lightDoc.flags[MODULE_ID]?.emissionWallId ?? null;
    }
}
