import { HookDefinitions } from "fvtt-hook-attacher";
import { OutdoorWallFlagNames } from "./outdoor_wall_flags";
import { MODULE_ID } from "../constants";

/**
 * Iterable of hook definitions for patching the AmbientLightConfig rendering.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "updateWall",
        callback: updateWall
    }]
}];

function updateWall(
    _document: WallDocument,
    change: WallDocument.UpdateData,
    _options: WallDocument.Database.UpdateOptions,
    _userId: string,
): void {
    if (change.flags?.[MODULE_ID]?.[OutdoorWallFlagNames.isBlockingOutdoorLight] === undefined)
        return;

    game.canvas?.perception.update({
        refreshEdges: true,         // Recompute edge intersections
        initializeLighting: true,   // Recompute light sources
        initializeVision: true,     // Recompute vision sources
        initializeSounds: true      // Recompute sound sources
    });
}
