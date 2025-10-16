
/**
 * Proxy type for an AmbientLight object, exposing only the methods used by Outdoor Light.
 * Implementation may vary depending on context (e.g. direct AmbientLight manipulation vs. UI manipulation).
 */
export type AmbientLightProxy = {
    /**
     * Sets the bright light radius (aka AmbientLightDocument.config.bright).
     */
    setBright(bright: number): void;
    /**
     * Sets the dim light radius (aka AmbientLightDocument.config.dim).
     */
    setDim(dim: number): void;
    /**
     * Gets the dim light radius (aka AmbientLightDocument.config.dim).
     */
    getDim(): number;
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
};
