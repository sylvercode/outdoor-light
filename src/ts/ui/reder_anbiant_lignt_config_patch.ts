import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import type { DataField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import { OutdoorLightFlagNames, OutdoorLightFlags, OutdoorLightFlagsDataModel } from "../data/outdoor_ligh_flags";
import AmbientLightConfig from "fvtt-types/src/foundry/client/applications/sheets/ambient-light-config.mjs";

/**
 * Iterable of hook definitions for patching the AmbientLightConfig rendering.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "renderAmbientLightConfig",
        callback: renderAmbientLightConfig as any // TypeScript types for AmbientLightConfig are incomplete
    }]
}];

/**
 * Callback for the renderAmbientLightConfig hook, modifies the AmbientLightConfig UI to support outdoor light flags.
 * @param application The AmbientLightConfig application instance.
 * @param element The root HTML element of the application.
 * @param context The render context for the application.
 * @param options The render options for the application.
 */
async function renderAmbientLightConfig(
    _application: AmbientLightConfig,
    element: HTMLElement,
    context: ApplicationV2.RenderContextOf<AmbientLightConfig>,
    _options: ApplicationV2.RenderOptionsOf<AmbientLightConfig>) {

    const content = element.querySelector(".window-content");
    if (!content) {
        console.error("Could not find .window-content element");
        return;
    }

    const ConstrainedByWall = content.querySelector('div.form-group:has(input[name="walls"])');
    if (!ConstrainedByWall) {
        console.error('Could not find div containing select[name="walls"]');
        return;
    }

    const dataModel = new OutdoorLightFlagsDataModel(context.document);

    function toFormGroup(fieldName: keyof OutdoorLightFlags, inputConfig?: { value: any, disabled?: boolean }) {
        const field = dataModel.schema.fields[fieldName] as DataField<any, any>;
        return field.toFormGroup(
            { rootId: context.rootId },
            inputConfig ?? { value: dataModel[fieldName] }
        );
    };

    const isOutdoorFieldGroup = toFormGroup(OutdoorLightFlagNames.isOutdoor);
    ConstrainedByWall.after(isOutdoorFieldGroup);
}
