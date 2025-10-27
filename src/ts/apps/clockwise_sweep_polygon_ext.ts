import type { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import type { Edge } from "fvtt-types/src/foundry/client/canvas/geometry/edges/_module.mjs";
import { EdgePatcher } from "./edge_patcher";

/**
 * LibWrapper patch definitions for ClockwiseSweepPolygon edge inclusion test logic.
 */
export const LIBWRAPPER_PATCHES: Iterable<LibWrapperWrapperDefinitions> = [
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
    const edge = getTestEdge(args[0] as Edge, this);
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
    if (!EdgePatcher.isClockwiseSweepPolygonLight(csp))
        return;

    for (const edge of csp.edges) {
        const edgeMod = EdgePatcher.getEdgeModForLight(edge, csp);
        if (edgeMod.hasModifications())
            edgeMod.applySensesTo(edge);
    }
}

/**
 * Returns a possibly modified Edge for testing, depending on outdoor light and border status.
 * @param csp The ClockwiseSweepPolygon instance
 * @param edge The edge to test
 * @returns The original or modified Edge
 */
function getTestEdge(edge: Edge, csp: ClockwiseSweepPolygon): Edge {
    if (!EdgePatcher.isClockwiseSweepPolygonLight(csp))
        return edge;

    const edgeMod = EdgePatcher.getEdgeModForLight(edge, csp);
    if (!edgeMod.hasModifications())
        return edge;

    const clonedEdge = edge.clone();
    edgeMod.applySensesTo(clonedEdge);
    return clonedEdge;
}
