import { HookDefinitions } from "fvtt-hook-attacher";
import { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import type SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";
import { MODULE_ID, UPPER_MODULE_ID } from "../../constants";
import getToolOrderInsertionSequence from "../../utils/get_tool_order_insertion_sequence";
import { AmbientLightProxy } from "../../proxies/ambient_light_proxy";
import applyDefaultOutdoorLightSettings from "../../apps/apply_default_outdoor_light_settings";
import { outdoorLightSettings } from "../../settings";

/**
 * Iterable of hook definitions for tools addition.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "getSceneControlButtons" as any, // getSceneControlButtons types are missing in fvtt-types
        callback: getSceneControlButtons as any
    }]
}];

/**
 * Iterable of wrapper patch definitions for tools behavior injection.
 */
export const LIBWRAPPER_PATCHS: Iterable<LibWrapperWrapperDefinitions> = [
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

/**
 * Name of the lighting layer.
 */
const LIGHTING_LAYER_NAME = foundry.canvas.layers.LightingLayer.layerOptions.name;

/**
 * Names of tools before which the new tool should be inserted.
 */
const EXTRA_TOOL_NAMES = ["day", "night", "reset", "clear"];

/**
 * Name of the new tool to be added.
 */
const TOGGLE_IS_OUTDOOR_TOOL_NAME = "toggleIsOutdoorLight";

/**
 * Hook callback to add the outdoor walls toggle tool to the scene controls.
 * @param controls The scene controls object.
 */
function getSceneControlButtons(controls: Record<string, SceneControls.Control>): void {
    if (game?.i18n == undefined)
        throw new Error("i18n not initialized");

    const lightTools = controls[LIGHTING_LAYER_NAME].tools;
    const getNextOrder = getToolOrderInsertionSequence(lightTools, EXTRA_TOOL_NAMES);

    lightTools[TOGGLE_IS_OUTDOOR_TOOL_NAME] = {
        name: TOGGLE_IS_OUTDOOR_TOOL_NAME,
        title: game.i18n.localize(`${UPPER_MODULE_ID}.SceneControl.${LIGHTING_LAYER_NAME}.${TOGGLE_IS_OUTDOOR_TOOL_NAME}`),
        icon: "fas fa-cloud-sun",
        toggle: true,
        active: false,
        order: getNextOrder(),
    };
}

/**
 * Logic to set the outdoor light flag when a new light is created with the outdoor lights tool active.
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

    const lightControls = ui.controls?.control;
    if (lightControls?.name !== LIGHTING_LAYER_NAME)
        return;

    const toggleIsOutdoorTool = lightControls.tools[TOGGLE_IS_OUTDOOR_TOOL_NAME].active ?? false;
    if (!toggleIsOutdoorTool)
        return;

    const outdoorFlags = lightDoc.flags[MODULE_ID] ??= {};
    outdoorFlags.isOutdoor = true;

    const scene = lightDoc.parent;
    if (scene == null)
        return;

    const ambientLightProxy = new AmbientLightDocumentProxy(lightDoc);
    applyDefaultOutdoorLightSettings(ambientLightProxy, scene);
}

/**
 * Proxy for AmbientLightDocument to implement the AmbientLightProxy interface.
 */
class AmbientLightDocumentProxy implements AmbientLightProxy {
    constructor(private lightDoc: AmbientLightDocument) { }

    /**
     * @inheritdoc
     */
    setBright(bright: number) {
        this.lightDoc.config.bright = bright;
    }
    /**
     * @inheritdoc
     */
    setDim(dim: number) {
        this.lightDoc.config.dim = dim;
    }
    /**
     * @inheritdoc
     */
    getDim(): number {
        return this.lightDoc.config.dim;
    }
    /**
     * @inheritdoc
     */
    setHidden(hidden: boolean) {
        this.lightDoc.hidden = hidden;
    }
    /**
     * @inheritdoc
     */
    setLuminosity(luminosity: number) {
        this.lightDoc.config.luminosity = luminosity;
    }
    /**
     * @inheritdoc
     */
    setDarknessMax(max: number) {
        this.lightDoc.config.darkness.max = max;
    }
    /**
     * @inheritdoc
     */
    setAttenuation(attenuation: number) {
        this.lightDoc.config.attenuation = attenuation;
    }
}
