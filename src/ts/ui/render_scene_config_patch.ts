import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import type { DataField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import type SceneConfig from "fvtt-types/src/foundry/client/applications/sheets/scene-config.mjs";
import { OutdoorSceneFlagNames, OutdoorSceneFlags, OutdoorSceneFlagsDataModel } from "../data/outdoor_scene_flags";

/**
 * Iterable of hook definitions for patching the SceneConfig rendering.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "renderSceneConfig",
        callback: renderSceneConfig
    }]
}];

/**
 * Callback for the renderSceneConfig hook, modifies the SceneConfig UI to support outdoor scene flags.
 * @param application The SceneConfig application instance.
 * @param element The root HTML element of the application.
 * @param context The render context for the application.
 * @param options The render options for the application.
 */
async function renderSceneConfig(
    _application: SceneConfig,
    element: HTMLElement,
    context: ApplicationV2.RenderContextOf<SceneConfig>,
    _options: ApplicationV2.RenderOptionsOf<SceneConfig>) {

    const content = element.querySelector(".window-content");
    if (!content) {
        console.error("Could not find .window-content element");
        return;
    }

    const DarknessLock = content.querySelector('div.form-group:has(input[name="environment.darknessLock"])');
    if (!DarknessLock) {
        console.error('Could not find div containing input[name="environment.darknessLock"]');
        return;
    }

    const dataModel = new OutdoorSceneFlagsDataModel(context.document);

    function toFormGroup(fieldName: keyof OutdoorSceneFlags, inputConfig?: { value: any, disabled?: boolean }) {
        const field = dataModel.schema.fields[fieldName] as DataField<any, any>;
        return field.toFormGroup(
            { rootId: context.rootId },
            inputConfig ?? { value: dataModel[fieldName] }
        );
    };

    const outdoorLightModeFieldGroup = toFormGroup(OutdoorSceneFlagNames.outdoorLightMode);
    DarknessLock.after(outdoorLightModeFieldGroup);
}
