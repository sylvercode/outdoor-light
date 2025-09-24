import { HookDefinitions } from "fvtt-hook-attacher";
import SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";
import { getToolOrderInsertionSequence } from "../utils/SceneControlsUtils";
import { UPPER_MODULE_ID } from "../constants";
/**
 * Iterable of hook definitions for patching the AmbientLightConfig rendering.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "getSceneControlButtons" as any, // getSceneControlButtons types are missing in fvtt-types
        callback: getSceneControlButtons as any
    }]
}];

const YELLOW_TOOL_NAMES = ["closeDoors", "clear"];

function getSceneControlButtons(controls: Record<string, SceneControls.Control>): void {
    const wallTools = controls["walls"].tools;
    const getNextOrder = getToolOrderInsertionSequence(wallTools, YELLOW_TOOL_NAMES);

    wallTools["toggleOutdoorWalls"] = {
        name: "toggleOutdoorWalls",
        title: game?.i18n?.localize(`${UPPER_MODULE_ID}.wallSceneControlButtons.toggleOutdoorWalls`) ?? "Toggle Outdoor Walls",
        icon: "fas fa-cloud-sun",
        toggle: true,
        active: false,
        order: getNextOrder(),
    };
}
