import type { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import type { Edge } from "fvtt-types/src/foundry/client/canvas/geometry/edges/_module.mjs";
import { OutdoorWallFlagsDataModel } from "../data/wall_ext";
import { OutdoorLightFlagsDataModel } from "../data/ambient_light_ext";

/**
 * LibWrapper patch definitions for ClockwiseSweepPolygon edge inclusion test logic.
 */
export const LIBWRAPPER_PATCHS: Iterable<LibWrapperWrapperDefinitions> = [
    {
        target: "foundry.canvas.geometry.ClockwiseSweepPolygon.prototype._testEdgeInclusion",
        fn: testEdgeInclusion_Wrapper,
        type: "WRAPPER"
    },
    {
        target: "foundry.canvas.geometry.ClockwiseSweepPolygon.prototype._identifyEdges",
        fn: identifyEdges_Wrapper,
        type: "WRAPPER"
    }
];

/**
 * Wrapper for the _testEdgeInclusion method to inject custom edge inclusion test logic.
 * @param this The ClockwiseSweepPolygon instance
 * @param wrapped The base wrapped function
 * @param args The arguments of the wrapped function
 * @returns The result of the wrapped function
 */
function testEdgeInclusion_Wrapper(this: ClockwiseSweepPolygon, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    const edge = getTestEdge(this, args[0] as Edge);
    const result = wrapped.apply(this, [edge, ...args.slice(1)]);
    return result;
}

/**
 * Wrapper for the _identifyEdges method to inject behavior after edge identification.
 * @param this The ClockwiseSweepPolygon instance
 * @param wrapped The base wrapped function
 * @param args The arguments of the wrapped function
 * @returns The result of the wrapped function
 */
function identifyEdges_Wrapper(this: ClockwiseSweepPolygon, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    const result = wrapped.apply(this, args);
    identifyEdges(this);
    return result;
}

/**
 * Change edge sense restrictions for outdoor walls.
 * @param csp The ClockwiseSweepPolygon instance.
 */
function identifyEdges(csp: ClockwiseSweepPolygon): void {
    if (!isOutdoorLight(csp))
        return;

    for (const edge of csp.edges) {
        const wallFlags = getWallDocFlags(edge);
        const forceNoRestriction = isLightForWallEmission(csp, wallFlags);
        if (forceNoRestriction || isOutdoorBorder(wallFlags))
            applyOutdoorWallSenseRestriction(edge, forceNoRestriction);
    }
}

/**
 * Returns a possibly modified Edge for testing, depending on outdoor light and border status.
 * @param csp The ClockwiseSweepPolygon instance
 * @param edge The edge to test
 * @returns The original or modified Edge
 */
function getTestEdge(csp: ClockwiseSweepPolygon, edge: Edge): Edge {
    const wallFlags = getWallDocFlags(edge);
    const forceNoRestriction = isLightForWallEmission(csp, wallFlags);
    if (!forceNoRestriction || !isOutdoorLight(csp) || !isOutdoorBorder(wallFlags))
        return edge;

    const clonedEdge = edge.clone();
    applyOutdoorWallSenseRestriction(clonedEdge, forceNoRestriction);
    return clonedEdge;
}

function isLightForWallEmission(csp: ClockwiseSweepPolygon, wallFlags: OutdoorWallFlagsDataModel | null): boolean {
    if (!wallFlags)
        return false;

    const cspObj = csp.config.source?.object;
    if (!(cspObj instanceof foundry.canvas.placeables.AmbientLight))
        return false;

    const lightId = cspObj.id;
    if (!lightId)
        return false;

    return wallFlags.lightEmission.lightId === lightId;
}

function getWallDocFlags(edge: Edge): OutdoorWallFlagsDataModel | null {
    const wallDoc = edge.object?.document;
    if (!(wallDoc instanceof WallDocument))
        return null;

    return new OutdoorWallFlagsDataModel(wallDoc);
}

/**
 * Applies sense restriction to an edge to block outdoor light.
 * @param edge The edge to modify
 */
function applyOutdoorWallSenseRestriction(edge: Edge, forceNoRestriction: boolean): void {
    edge.light = forceNoRestriction ? CONST.WALL_SENSE_TYPES.NONE : CONST.WALL_SENSE_TYPES.NORMAL;
    edge.threshold = undefined;
}

/**
 * Determines if the ClockwiseSweepPolygon's source is an outdoor light.
 * @param csp The ClockwiseSweepPolygon instance
 * @returns True if the source is an outdoor light, false otherwise
 */
function isOutdoorLight(csp: ClockwiseSweepPolygon): boolean {
    if (!(csp.config.source?.object instanceof foundry.canvas.placeables.AmbientLight))
        return false;

    const dataModel = new OutdoorLightFlagsDataModel(csp.config.source.object.document);
    return dataModel.isOutdoor;
}

/**
 * Determines if the edge is a wall that blocks outdoor light.
 * @param edge The edge to test
 * @returns True if the edge blocks outdoor light, false otherwise
 */
function isOutdoorBorder(outdoorWallFlags: OutdoorWallFlagsDataModel | null): boolean {
    if (!outdoorWallFlags)
        return false;

    return outdoorWallFlags.isBlockingOutdoorLight;
}
