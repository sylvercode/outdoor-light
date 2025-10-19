import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import WallConfig from "fvtt-types/src/foundry/client/applications/sheets/wall-config.mjs";
import { LightEmissionDataSchema, LightEmissionKey, LightEmissionSide, LightEmissionUnits, OutdoorWallFlagName, OutdoorWallFlagsDataModel } from "../../data/wall_ext";
import { renderTemplateHtml } from "src/ts/utils/render_template_html";
import { outdoorLightSettings } from "src/ts/settings";
import FieldBuilder from "src/ts/utils/field_builder";

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

    const rootFieldBuilder = new FieldBuilder(context.rootId, dataModel.schema.fields, dataModel);

    const isBlockingOutdoorLightFormGroup = rootFieldBuilder.get(OutdoorWallFlagName.isBlockingOutdoorLight);
    fieldset.append(isBlockingOutdoorLightFormGroup);

    const lightEmissionFieldSet: HTMLFieldSetElement = await renderTemplateHtml("modules/outdoor-light/templates/light_emission_settings_fieldset.hbs", {});
    fieldset.append(lightEmissionFieldSet);

    const lightEmissionFieldBuilder = new FieldBuilder(context.rootId, dataModel.schema.fields.lightEmission.fields, dataModel.lightEmission);

    const lightEmissionSide = dataModel.lightEmission?.side ?? LightEmissionSide.none;
    const lightEmissionSideDisabled = lightEmissionSide === LightEmissionSide.none;

    const lightEmissionSideFieldGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.side,
        { value: lightEmissionSide, localize: true }
    );
    changeLabelText(lightEmissionSideFieldGroup, "OUTDOOR-LIGHT.side");
    lightEmissionFieldSet.append(lightEmissionSideFieldGroup);

    const lightEmissionRadiusFormGroup: HTMLDivElement = await renderTemplateHtml("modules/outdoor-light/templates/light_emission_settings_radius_form_group.hbs", {});
    lightEmissionFieldSet.append(lightEmissionRadiusFormGroup);

    const lightEmissionDimValue = dataModel.lightEmission?.dim ?? outdoorLightSettings.wallLightEmissionDimRadius();
    const lightEmissionDimFormGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.dim,
        { disabled: lightEmissionSideDisabled, value: lightEmissionDimValue }
    );
    changeLabelText(lightEmissionDimFormGroup, "OUTDOOR-LIGHT.dim");
    moveLabelAndInputTo(lightEmissionDimFormGroup, lightEmissionRadiusFormGroup);

    const lightEmissionBrightValue = dataModel.lightEmission?.bright ?? outdoorLightSettings.wallLightEmissionBrightRadius();
    const lightEmissionBrightFormGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.bright,
        { disabled: lightEmissionSideDisabled, value: lightEmissionBrightValue }
    );
    changeLabelText(lightEmissionBrightFormGroup, "OUTDOOR-LIGHT.bright");
    moveLabelAndInputTo(lightEmissionBrightFormGroup, lightEmissionRadiusFormGroup);

    const lightEmissionUnitsFormGroup = lightEmissionFieldBuilder.get(LightEmissionKey.units, { disabled: lightEmissionSideDisabled, localize: true });
    changeLabelText(lightEmissionUnitsFormGroup, "OUTDOOR-LIGHT.units");
    lightEmissionFieldSet.append(lightEmissionUnitsFormGroup);

    addEventListenerToSideSelect(dataModel.schema.fields.lightEmission.fields, lightEmissionFieldSet);
}

/**
 * Changes the label text of a field group.
 * @param fieldGroup The field group element.
 * @param textKey The localization key for the label text.
 */
function changeLabelText(fieldGroup: HTMLDivElement, textKey: string) {
    if (!game.i18n) {
        console.error("i18n not initialized");
        return;
    }

    const label = fieldGroup.querySelector('label');
    if (!label) {
        console.error("Label not found in field group");
        return;
    }

    label.textContent = game.i18n.localize(textKey);
}

/**
 * Moves the label and input elements from the source field group to the target field group.
 * @param source The source field group element.
 * @param target The target field group element.
 */
function moveLabelAndInputTo(source: HTMLDivElement, target: HTMLDivElement) {
    const label = source.querySelector('label');
    const input = source.querySelector('input');

    if (!label || !input) {
        throw new Error("Label or input not found in source");
    }

    target.append(label);
    target.append(input);
}

/**
 * Adds an event listener to the side select element to enable/disable related inputs.
 * @param schema The light emission data schema.
 * @param fieldSet The field set element containing the inputs.
 */
function addEventListenerToSideSelect(
    schema: LightEmissionDataSchema,
    fieldSet: HTMLFieldSetElement) {
    const select = fieldSet.querySelector(`select[name="${schema[LightEmissionKey.side].fieldPath}"]`);
    const dimInput = fieldSet.querySelector(`input[name="${schema[LightEmissionKey.dim].fieldPath}"]`) as HTMLInputElement;
    const brightInput = fieldSet.querySelector(`input[name="${schema[LightEmissionKey.bright].fieldPath}"]`) as HTMLInputElement;
    const unitsInput = fieldSet.querySelector(`select[name="${schema[LightEmissionKey.units].fieldPath}"]`) as HTMLSelectElement;
    if (!select || !dimInput || !brightInput || !unitsInput) {
        throw new Error("Missing input elements for light emission settings");
    }

    select.addEventListener("change", () => {
        const value = (select as HTMLSelectElement).value as LightEmissionSide;
        const disabled = value === LightEmissionSide.none;
        dimInput.disabled = disabled;
        brightInput.disabled = disabled;
        unitsInput.disabled = disabled;

        if (!disabled) {
            if (!dimInput.value)
                dimInput.value = outdoorLightSettings.wallLightEmissionDimRadius().toString();
            if (!brightInput.value)
                brightInput.value = outdoorLightSettings.wallLightEmissionBrightRadius().toString();
            if (!unitsInput.value)
                unitsInput.value = LightEmissionUnits.wallLengthProportionalRatio;
        }
    });
}
