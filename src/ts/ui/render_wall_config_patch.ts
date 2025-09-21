import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import type { DataField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import WallConfig from "fvtt-types/src/foundry/client/applications/sheets/wall-config.mjs";
import { OutdoorWallFlagNames, OutdoorWallFlags, OutdoorWallFlagsDataModel } from "../data/outdoor_wall_flags";

/**
 * Iterable of hook definitions for patching the WallConfig rendering.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "renderWallConfig",
        callback: renderWallConfig
    }]
}];

/**
 * Callback for the renderWallConfig hook, modifies the WallConfig UI to support outdoor border wall flags.
 * @param application The WallConfig application instance.
 * @param element The root HTML element of the application.
 * @param context The render context for the application.
 * @param options The render options for the application.
 */
async function renderWallConfig(
    _application: WallConfig,
    element: HTMLElement,
    context: ApplicationV2.RenderContextOf<WallConfig>,
    _options: ApplicationV2.RenderOptionsOf<WallConfig>) {

    const content = element.querySelector(".window-content");
    if (!content) {
        console.error("Could not find .window-content element");
        return;
    }

    const fieldset = content.querySelector('fieldset:has(select[name="sight"])');
    if (!fieldset) {
        console.error('Could not find fieldset containing select[name="sight"]');
        return;
    }

    const dataModel = new OutdoorWallFlagsDataModel(context.document);

    function toFormGroup(fieldName: keyof OutdoorWallFlags, inputConfig?: { value: any, disabled?: boolean }) {
        const field = dataModel.schema.fields[fieldName] as DataField<any, any>;
        return field.toFormGroup(
            { rootId: context.rootId },
            inputConfig ?? { value: dataModel[fieldName] }
        );
    };

    const isBlockingOutdoorLightFieldGroup = toFormGroup(OutdoorWallFlagNames.isBlockingOutdoorLight);
    fieldset.append(isBlockingOutdoorLightFieldGroup);
}
