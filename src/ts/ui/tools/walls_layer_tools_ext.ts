import { HookDefinitions } from "fvtt-hook-attacher";
import { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import type SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";
import { MODULE_ID, UPPER_MODULE_ID } from "../../constants";
import getToolOrderInsertionSequence from "../../utils/get_tool_order_insertion_sequence";

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
        target: "foundry.canvas.layers.WallsLayer.prototype._onDragLeftDrop",
        fn: WallsLayer_onDragLeftDrop_Wrapper,
        type: "WRAPPER"
    }
];

/**
 * Wrapper for the WallsLayer _onDragLeftDrop method to inject custom wall creation logic.
 * @param this The WallsLayer instance
 * @param wrapped The base wrapped function
 * @param args The arguments of the wrapped function
 * @returns The result of the wrapped function
 */
function WallsLayer_onDragLeftDrop_Wrapper(this: WallsLayer, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    WallsLayer_onDragLeftDrop(args[0] as Canvas.Event.Pointer<Wall>);
    return wrapped.apply(this, args);
}

/**
 * Name of the walls layer.
 */
const WALLS_LAYER_NAME = foundry.canvas.layers.WallsLayer.layerOptions.name;

/**
 * Names of tools before which the new tool should be inserted.
 */
const YELLOW_TOOL_NAMES = ["closeDoors", "clear"];

/**
 * Name of the new tool to be added.
 */
const TOGGLE_OUTDOOR_WALLS_TOOL_NAME = "toggleOutdoorWalls";

/**
 * Hook callback to add the outdoor walls toggle tool to the scene controls.
 * @param controls The scene controls object.
 */
function getSceneControlButtons(controls: Record<string, SceneControls.Control>): void {
    if (game?.i18n == undefined)
        throw new Error("i18n not initialized");

    const wallTools = controls[WALLS_LAYER_NAME].tools;
    const getNextOrder = getToolOrderInsertionSequence(wallTools, YELLOW_TOOL_NAMES);

    wallTools[TOGGLE_OUTDOOR_WALLS_TOOL_NAME] = {
        name: TOGGLE_OUTDOOR_WALLS_TOOL_NAME,
        title: game.i18n.localize(`${UPPER_MODULE_ID}.SceneControl.${WALLS_LAYER_NAME}.${TOGGLE_OUTDOOR_WALLS_TOOL_NAME}`),
        icon: "fas fa-cloud-sun",
        toggle: true,
        active: false,
        order: getNextOrder(),
    };
}

/**
 * Logic to set the outdoor wall flag when a new wall is created with the outdoor walls tool active.
 * @param event The pointer event for the wall creation.
 */
function WallsLayer_onDragLeftDrop(event: Canvas.Event.Pointer<Wall>): void {
    const wallDoc = event.interactionData.preview?.document;
    // Nothing to do for existing walls
    if (wallDoc?.id !== null)
        return;

    const wallControls = ui.controls?.control;
    if (wallControls?.name !== WALLS_LAYER_NAME)
        return;

    const toggleOutdoorWallsTool = wallControls.tools[TOGGLE_OUTDOOR_WALLS_TOOL_NAME].active ?? false;
    if (!toggleOutdoorWallsTool)
        return;

    // Use foundry use the _source to create the document, so we need to set the flag there.
    const outdoorFlags = wallDoc._source.flags[MODULE_ID] ??= {};
    outdoorFlags.isBlockingOutdoorLight = true;
}
