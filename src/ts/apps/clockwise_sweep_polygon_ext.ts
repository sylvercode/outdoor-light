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
        if (isOutdoorBorder(edge))
            applyOutdoorWallSenseRestriction(edge);
    }
}

/**
 * Returns a possibly modified Edge for testing, depending on outdoor light and border status.
 * @param csp The ClockwiseSweepPolygon instance
 * @param edge The edge to test
 * @returns The original or modified Edge
 */
function getTestEdge(csp: ClockwiseSweepPolygon, edge: Edge): Edge {
    if (!isOutdoorLight(csp) || !isOutdoorBorder(edge))
        return edge;

    const clonedEdge = edge.clone();
    applyOutdoorWallSenseRestriction(clonedEdge);
    return clonedEdge;
}

/**
 * Applies sense restriction to an edge to block outdoor light.
 * @param edge The edge to modify
 */
function applyOutdoorWallSenseRestriction(edge: Edge): void {
    edge.light = CONST.WALL_SENSE_TYPES.NORMAL;
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
function isOutdoorBorder(edge: Edge): boolean {
    if (!(edge.object?.document instanceof WallDocument))
        return false;

    const dataModel = new OutdoorWallFlagsDataModel(edge.object.document);
    return dataModel.isBlockingOutdoorLight;
}
