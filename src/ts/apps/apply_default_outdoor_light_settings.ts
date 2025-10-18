import { OutdoorLightMode, OutdoorLightStatus, OutdoorSceneFlagsDataModel } from "../data/scene_ext";
import { AmbientLightProxy } from "../proxies/ambient_light_proxy";

/**
 * Options for applying default outdoor light settings.
 */
export type Options = { luminosity?: boolean, attenuation?: boolean, maxDarkness?: boolean, brightDimHidden?: boolean };

/**
 * Default options for applying outdoor light settings.
 */
const DEFAULT_OPTIONS: { [K in keyof Required<Options>]: true } = {
    luminosity: true,
    attenuation: true,
    maxDarkness: true,
    brightDimHidden: true
};

/**
 * Applies default outdoor light settings to AmbientLight based on the Scene Flags.
 * @param light The AmbientLightProxy to apply settings to.
 * @param options Options to control which settings to apply. Defaults to all true.
 */
export default function applyDefaultOutdoorLightSettings(light: AmbientLightProxy, options: Options = DEFAULT_OPTIONS): void {
    const scene = light.getScene();
    const outdoorSceneFlags = new OutdoorSceneFlagsDataModel(scene);

    if (!outdoorSceneFlags.outdoorLightMode)
        return;

    if (options.brightDimHidden) {
        if (outdoorSceneFlags.outdoorLightStatus === OutdoorLightStatus.dim) {
            light.setDim(Math.max(light.getBright(), light.getDim()));
            light.setBright(0);
        }
        else {
            light.setBright(Math.max(light.getBright(), light.getDim()));
            light.setDim(0);
        }

        light.setHidden(outdoorSceneFlags.outdoorLightStatus === OutdoorLightStatus.off);
    }

    if (outdoorSceneFlags.outdoorLightMode === OutdoorLightMode.manualGlobalLight) {
        if (options.luminosity)
            light.setLuminosity(0);

        if (options.maxDarkness) {
            const sceneMaxDarkness = scene.environment.globalLight.darkness.max;
            if (sceneMaxDarkness !== undefined)
                light.setDarknessMax(sceneMaxDarkness);
        }
    }
    else {
        if (options.attenuation)
            light.setAttenuation(0);
    }
}
