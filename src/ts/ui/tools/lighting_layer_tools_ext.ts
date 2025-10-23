import { HookDefinitions } from "fvtt-hook-attacher";
import type SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";
import getToolOrderInsertionSequence from "../../utils/get_tool_order_insertion_sequence";
import { getChangeLightStatusTool } from "./change_light_status";
import getToggleOutdoorLayer from "./toggle_outdoor_layer";

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
 * Name of the lighting layer.
 */
const LIGHTING_LAYER_NAME = foundry.canvas.layers.LightingLayer.layerOptions.name;

/**
 * Names of tools before which the new tool should be inserted.
 */
const EXTRA_TOOL_NAMES = ["day", "night", "reset", "clear"];


/**
 * Hook callback to add the outdoor walls toggle tool to the scene controls.
 * @param controls The scene controls object.
 */
function getSceneControlButtons(controls: Record<string, SceneControls.Control>): void {

    const lightTools = controls[LIGHTING_LAYER_NAME].tools;

    const getNextOrder = getToolOrderInsertionSequence(lightTools, EXTRA_TOOL_NAMES);

    const toggleOutdoorLayerTool = getToggleOutdoorLayer(getNextOrder());
    lightTools[toggleOutdoorLayerTool.name] = toggleOutdoorLayerTool;

    const changeLightStatusTool = getChangeLightStatusTool(getNextOrder());
    lightTools[changeLightStatusTool.name] = changeLightStatusTool;
}
