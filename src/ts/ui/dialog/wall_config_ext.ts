import { HookDefinitions } from "fvtt-hook-attacher";
import type ApplicationV2 from "fvtt-types/src/foundry/client/applications/api/application.mjs";
import WallConfig from "fvtt-types/src/foundry/client/applications/sheets/wall-config.mjs";
import { LightEmissionDataSchema, LightEmissionKey, LightEmissionUnits, OutdoorWallFlagName, OutdoorWallFlagsDataModel } from "../../data/wall_ext";
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

    const restrictionFieldset = content.querySelector('fieldset:has(select[name="sight"])');
    const doorFieldset = content.querySelector('fieldset:has(select[name="door"])');
    if (!restrictionFieldset || !doorFieldset) {
        console.error('Could not find fieldset containing select[name="sight"] or select[name="door"]');
        return;
    }

    const dataModel = new OutdoorWallFlagsDataModel(context.document);

    const rootFieldBuilder = new FieldBuilder(context.rootId, dataModel.schema.fields, dataModel);

    const isBlockingOutdoorLightFormGroup = rootFieldBuilder.get(OutdoorWallFlagName.isBlockingOutdoorLight);
    moveInputInMainDiv(isBlockingOutdoorLightFormGroup);
    restrictionFieldset.append(isBlockingOutdoorLightFormGroup);

    const lightEmissionFieldBuilder = new FieldBuilder(context.rootId, dataModel.schema.fields.lightEmission.fields, dataModel.lightEmission);

    const lightEmissionEnabled = dataModel.lightEmission?.enabled;

    const lightEmissionEnabledFieldGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.enabled,
        { value: lightEmissionEnabled, localize: true }
    );
    moveInputInMainDiv(lightEmissionEnabledFieldGroup);
    restrictionFieldset.append(lightEmissionEnabledFieldGroup);

    const lightEmissionFieldSet: HTMLFieldSetElement = await renderTemplateHtml("modules/outdoor-light/templates/light_emission_settings_fieldset.hbs", {});
    restrictionFieldset.append(lightEmissionFieldSet);

    const lightEmissionRadiusFormGroup: HTMLDivElement = await renderTemplateHtml("modules/outdoor-light/templates/light_emission_settings_radius_form_group.hbs", {});
    lightEmissionFieldSet.append(lightEmissionRadiusFormGroup);

    const lightEmissionDimValue = dataModel.lightEmission?.dim ?? outdoorLightSettings.wallLightEmissionDimRadius();
    const lightEmissionDimFormGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.dim,
        { disabled: !lightEmissionEnabled, value: lightEmissionDimValue }
    );
    changeLabelText(lightEmissionDimFormGroup, "OUTDOOR-LIGHT.dim");
    moveLabelAndInputTo(lightEmissionDimFormGroup, lightEmissionRadiusFormGroup);

    const lightEmissionBrightValue = dataModel.lightEmission?.bright ?? outdoorLightSettings.wallLightEmissionBrightRadius();
    const lightEmissionBrightFormGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.bright,
        { disabled: !lightEmissionEnabled, value: lightEmissionBrightValue }
    );
    changeLabelText(lightEmissionBrightFormGroup, "OUTDOOR-LIGHT.bright");
    moveLabelAndInputTo(lightEmissionBrightFormGroup, lightEmissionRadiusFormGroup);

    const lightEmissionUnitsFormGroup = lightEmissionFieldBuilder.get(
        LightEmissionKey.units,
        { disabled: !lightEmissionEnabled, localize: true });
    changeLabelText(lightEmissionUnitsFormGroup, "OUTDOOR-LIGHT.units");
    lightEmissionFieldSet.append(lightEmissionUnitsFormGroup);

    addEventListenerToEmissionLightCheckbox(dataModel.schema.fields.lightEmission.fields, restrictionFieldset);

    const doorFieldGroup = doorFieldset.querySelector('.form-group:has(select[name="door"])') as HTMLDivElement;
    if (!doorFieldGroup) {
        console.error('Could not find .form-group containing select[name="door"]');
        return;
    }

    const isCurtainFormGroup = rootFieldBuilder.get(OutdoorWallFlagName.isCurtain, { value: dataModel.isCurtain });
    moveInputInMainDiv(isCurtainFormGroup);
    doorFieldGroup.after(isCurtainFormGroup);
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

function moveInputInMainDiv(source: HTMLDivElement) {
    const input = source.querySelector('input');
    const subDiv = input?.parentElement;

    if (!input || !subDiv || subDiv === source) {
        console.error("Input or sub-div not found or invalid in source");
        return;
    }

    source.append(input);
    subDiv.remove();
}

/**
 * Adds an event listener to the emission light checkbox element to enable/disable related inputs.
 * @param schema The light emission data schema.
 * @param fieldSet The field set element containing the inputs.
 */
function addEventListenerToEmissionLightCheckbox(
    schema: LightEmissionDataSchema,
    fieldSet: Element) {
    const enabledCheckbox = fieldSet.querySelector(`input[name="${schema[LightEmissionKey.enabled].fieldPath}"]`) as HTMLInputElement;
    const dimInput = fieldSet.querySelector(`input[name="${schema[LightEmissionKey.dim].fieldPath}"]`) as HTMLInputElement;
    const brightInput = fieldSet.querySelector(`input[name="${schema[LightEmissionKey.bright].fieldPath}"]`) as HTMLInputElement;
    const unitsInput = fieldSet.querySelector(`select[name="${schema[LightEmissionKey.units].fieldPath}"]`) as HTMLSelectElement;
    if (!enabledCheckbox || !dimInput || !brightInput || !unitsInput) {
        throw new Error("Missing input elements for light emission settings");
    }

    enabledCheckbox.addEventListener("change", () => {
        const disabled = !enabledCheckbox.checked;
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
