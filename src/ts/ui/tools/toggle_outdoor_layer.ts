import { HookDefinitions } from "fvtt-hook-attacher";
import type { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import applyDefaultOutdoorLightSettings from "src/ts/apps/apply_default_outdoor_light_settings";
import { MODULE_ID, UPPER_MODULE_ID } from "src/ts/constants";
import { AmbientLightDocumentProxy, AmbientLightDocWithParent } from "src/ts/proxies/ambient_light_proxy";
import { outdoorLightSettings } from "src/ts/settings";


/**
 * Name of the new tool to be added.ggit push
 */
const TOGGLE_OUTDOOR_LAYER_TOOL_NAME = "toggleOutdoorLayer";
/**
 * Name of the lighting layer.
 */
const LIGHTING_LAYER_NAME = foundry.canvas.layers.LightingLayer.layerOptions.name;

/**
 * Factory function to create the outdoor layer toggle tool.
 * @param order The order of the tool in the tools list.
 * @returns The tool definition.
 */
export default function getToggleOutdoorLayer(order: number): SceneControls.Tool {
    if (game?.i18n == undefined)
        throw new Error("i18n not initialized");

    return {
        name: TOGGLE_OUTDOOR_LAYER_TOOL_NAME,
        title: game.i18n.localize(`${UPPER_MODULE_ID}.SceneControl.${LIGHTING_LAYER_NAME}.${TOGGLE_OUTDOOR_LAYER_TOOL_NAME}.title`),
        icon: "fas fa-cloud-sun",
        toggle: true,
        active: false,
        order,
        onChange: onChangeToggleOutdoorLayer
    };
}

/**
 * Callback for when the outdoor layer toggle tool is changed.
 * @param _event The event that triggered the change.
 * @param _active Whether the tool is now active.
 */
async function onChangeToggleOutdoorLayer(_event: Event, _active: boolean) {
    const lightLayer = game.canvas?.getLayerByEmbeddedName("AmbientLight");
    if (!lightLayer)
        return;

    lightLayer.placeables.forEach(refreshAmbientLightControlIconVisibility);
}

/**
 * Refreshes the visibility of the control icon for an ambient light based on its outdoor status and the tool state.
 * @param light The ambient light to refresh.
 */
function refreshAmbientLightControlIconVisibility(light: AmbientLight): void {
    const isOutdoor = light.document.flags[MODULE_ID]?.isOutdoor ?? false;
    const controlIcon = light.controlIcon;
    if (controlIcon)
        controlIcon.visible = isOutdoor === isOutdoorLayerActive();
}

/**
 * Logic to set the outdoor light flag when a new light is created with the outdoor lights layer active.
 * @param event The pointer event for the light creation.
 */
function LightingLayer_onDragLeftDrop(event: Canvas.Event.Pointer<AmbientLight>): void {
    const lightDoc = event.interactionData.preview?.document;
    // Nothing to do for existing lights
    if (lightDoc?.id !== null)
        return;

    const defaultLightAttenuationValue = outdoorLightSettings.defaultLightAttenuationValue();
    if (defaultLightAttenuationValue !== null) {
        lightDoc.config.attenuation = defaultLightAttenuationValue;
    }

    if (!isOutdoorLayerActive())
        return;

    const outdoorFlags = lightDoc.flags[MODULE_ID] ??= {};
    outdoorFlags.isOutdoor = true;

    if (!lightDoc.parent)
        throw new Error("Light document should have a parent at this point");

    const ambientLightProxy = new AmbientLightDocumentProxy(lightDoc as AmbientLightDocWithParent);
    applyDefaultOutdoorLightSettings(ambientLightProxy);
}

/**
 * Checks if the outdoor layer toggle tool is currently active.
 */
function isOutdoorLayerActive(): boolean {
    const lightControls = ui.controls?.control;
    if (lightControls?.name !== LIGHTING_LAYER_NAME)
        return false;

    return lightControls.tools[TOGGLE_OUTDOOR_LAYER_TOOL_NAME].active ?? false;
}

/**
 * Iterable of hook definitions for tools addition.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "refreshAmbientLight",
        callback: refreshAmbientLightControlIconVisibility,
    }]
}];

/**
 * Iterable of wrapper patch definitions for tools behavior injection.
 */
export const LIBWRAPPER_PATCHES: Iterable<LibWrapperWrapperDefinitions> = [
    {
        target: "foundry.canvas.layers.LightingLayer.prototype._onDragLeftDrop",
        fn: LightingLayer_onDragLeftDrop_Wrapper,
        type: "WRAPPER"
    }
];

/**
 * Wrapper for the LightingLayer _onDragLeftDrop method to inject custom light creation logic.
 * @param this The LightingLayer instance
 * @param wrapped The base wrapped function
 * @param args The arguments of the wrapped function
 * @returns The result of the wrapped function
 */
function LightingLayer_onDragLeftDrop_Wrapper(this: LightingLayer, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    LightingLayer_onDragLeftDrop(args[0] as Canvas.Event.Pointer<AmbientLight>);
    return wrapped.apply(this, args);
}
