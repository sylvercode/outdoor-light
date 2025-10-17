import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import type { DataField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import AmbientLightConfig from "fvtt-types/src/foundry/client/applications/sheets/ambient-light-config.mjs";
import { OutdoorLightFlagNames, OutdoorLightFlags, OutdoorLightFlagsDataModel } from "../../data/ambient_light_ext";
import applyDefaultOutdoorLightSettings from "../../apps/apply_default_outdoor_light_settings";
import { AmbientLightProxy } from "../../proxies/ambient_light_proxy";

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
        console.error('Could not find div containing input[name="walls"]');
        return;
    }

    if (!content.querySelector('input[name="hidden"]')) {
        // By default in Foundry V13, there is no input for hidden state of the light.
        // If its still the case in the future (and no other module add it), we add it here, hidden, 
        // so that we can control it via our AmbientLightBroker interface.
        const hiddenFieldGroup = context.document.schema.fields.hidden.toFormGroup({ rootId: context.rootId }, { value: context.document.hidden });
        hiddenFieldGroup.style.display = "none";
        content.prepend(hiddenFieldGroup);
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

    const isOutdoorFieldInput = isOutdoorFieldGroup.querySelector("input") as HTMLInputElement | null;
    if (!isOutdoorFieldInput) {
        console.error(`Could not find input for ${OutdoorLightFlagNames.isOutdoor}`);
        return;
    }

    const ambientLightProxy = new AmbientLightAppConfigProxy(content);
    isOutdoorFieldInput.addEventListener("change", async () => {
        if (!isOutdoorFieldInput.checked
            || context.document.parent === null
        )
            return;

        applyDefaultOutdoorLightSettings(ambientLightProxy, context.document.parent);
    });
}

/**
 * Implementation of AmbientLightProxy that manipulates the AmbientLightConfig application UI.
 */
class AmbientLightAppConfigProxy implements AmbientLightProxy {
    constructor(private content: Element) { }

    /**
     * @inheritdoc
     */
    getBright(): number {
        const brightInput = this.content.querySelector('input[name="config.bright"]') as HTMLInputElement | null;
        if (!brightInput) {
            console.error('Could not find input[name="config.bright"]');
            return 0;
        }
        return Number(brightInput.value);
    }
    /**
     * @inheritdoc
     */
    setBright(bright: number) {
        const brightInput = this.content.querySelector('input[name="config.bright"]') as HTMLInputElement | null;
        if (!brightInput) {
            console.error('Could not find input[name="config.bright"]');
            return;
        }
        brightInput.value = String(bright);
    }
    /**
     * @inheritdoc
     */
    getDim(): number {
        const dimInput = this.content.querySelector('input[name="config.dim"]') as HTMLInputElement | null;
        if (!dimInput) {
            console.error('Could not find input[name="config.dim"]');
            return 0;
        }
        return Number(dimInput.value);
    }
    /**
     * @inheritdoc
     */
    setDim(dim: number) {
        const dimInput = this.content.querySelector('input[name="config.dim"]') as HTMLInputElement | null;
        if (!dimInput) {
            console.error('Could not find input[name="config.dim"]');
            return;
        }
        dimInput.value = String(dim);
    }
    /**
     * @inheritdoc
     */
    setHidden(hidden: boolean) {
        const hiddenInput = this.content.querySelector('input[name="hidden"]') as HTMLInputElement | null;
        if (!hiddenInput) {
            console.error('Could not find input[name="hidden"]');
            return;
        }
        hiddenInput.checked = hidden;
    }
    /**
     * @inheritdoc
     */
    setLuminosity(luminosity: number) {
        const luminosityInput = this.content.querySelector('range-picker[name="config.luminosity"]') as HTMLInputElement | null;
        if (!luminosityInput) {
            console.error('Could not find range-picker[name="config.luminosity"]');
            return;
        }
        luminosityInput.value = String(luminosity);
    }
    /**
     * @inheritdoc
     */
    setDarknessMax(max: number) {
        const darknessMaxInput = this.content.querySelector('input[name="config.darkness.max"]') as HTMLInputElement | null;
        if (!darknessMaxInput) {
            console.error('Could not find input[name="config.darkness.max"]');
            return;
        }
        darknessMaxInput.value = String(max);
    }
    /**
     * @inheritdoc
     */
    setAttenuation(attenuation: number) {
        const attenuationInput = this.content.querySelector('range-picker[name="config.attenuation"]') as HTMLInputElement | null;
        if (!attenuationInput) {
            console.error('Could not find range-picker[name="config.attenuation"]');
            return;
        }
        attenuationInput.value = String(attenuation);
    }
}
