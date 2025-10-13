import { HookDefinitions } from "fvtt-hook-attacher";
import { OutdoorLightModes, OutdoorSceneFlagsDataModel } from "./outdoor_scene_flags";
import { OutdoorLightFlagsDataModel } from "./outdoor_light_flags";

/**
 * Iterable of hook definitions for patching the Scene Document.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "updateScene",
        callback: updateScene
    }]
}];

function updateScene(
    scene: Scene,
    change: Scene.UpdateData,
    _options: Scene.Database.UpdateOptions,
    _userId: string,
): void {
    const maxDarkness = change.environment?.globalLight?.darkness?.max;
    if (maxDarkness === undefined)
        return;

    const sceneOutdoorFlag = new OutdoorSceneFlagsDataModel(scene);
    if (sceneOutdoorFlag.outdoorLightMode !== OutdoorLightModes.manualGlobalLight)
        return;

    scene.lights.forEach(light => {
        const lightOutdoorFlag = new OutdoorLightFlagsDataModel(light);
        if (!lightOutdoorFlag.isOutdoor)
            return;
        light.update({
            config: { darkness: { max: maxDarkness } }
        });
    });
}
