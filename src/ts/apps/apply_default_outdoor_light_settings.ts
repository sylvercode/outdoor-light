import { OutdoorLightMode, OutdoorLightStatus, OutdoorSceneFlagsDataModel } from "../data/outdoor_scene_flags";
import { AmbientLightProxy } from "../proxies/ambient_light_proxy";

/**
 * Applies default outdoor light settings to AmbientLight based on the Scene Flags.
 * @param light The AmbientLightProxy to apply settings to.
 * @param scene The Scene containing the AmbientLight.
 */
export default function applyDefaultOutdoorLightSettings(light: AmbientLightProxy, scene: Scene): void {
    const outdoorSceneFlags = new OutdoorSceneFlagsDataModel(scene);

    if (!outdoorSceneFlags.outdoorLightMode)
        return;

    if (outdoorSceneFlags.outdoorLightStatus == OutdoorLightStatus.dim)
        light.setBright(0);
    else {
        light.setBright(light.getDim());
        light.setDim(0);
    }

    if (outdoorSceneFlags.outdoorLightStatus == OutdoorLightStatus.off)
        light.setHidden(true);

    if (outdoorSceneFlags.outdoorLightMode === OutdoorLightMode.manualGlobalLight) {
        light.setLuminosity(0);
        const sceneMaxDarkness = scene.environment.globalLight.darkness.max;
        if (sceneMaxDarkness !== undefined)
            light.setDarknessMax(sceneMaxDarkness);
    }
    else {
        light.setAttenuation(0);
    }
}
