import { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import Edge from "node_modules/fvtt-types/src/foundry/client/canvas/geometry/edges/edge.mjs";
import CanvasEdges from "node_modules/fvtt-types/src/foundry/client/canvas/geometry/edges/edges.mjs";
import { EdgePatcher } from "./edge_patcher";

/**
 * LibWrapper patch definitions for CanvasEdges getEdges method.
 */
export const LIBWRAPPER_PATCHES: Iterable<LibWrapperWrapperDefinitions> = [
    {
        target: "foundry.canvas.geometry.edges.CanvasEdges.prototype.getEdges",
        fn: getEdges_Wrapper,
        type: "WRAPPER"
    }
];

/**
 * Wrapper for the getEdges method to inject custom edge modifications based on wall and light properties.
 * @param this The CanvasEdges instance
 * @param wrapped The base wrapped function
 * @param args The arguments of the wrapped function
 * @returns The result of the wrapped function
 */
function getEdges_Wrapper(this: CanvasEdges, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    const clonedMap = new Map<Edge, Edge>();
    const options = (() => {
        const argOption = args[1] as CanvasEdges.GetEdgesOptions | undefined;
        if (!argOption)
            return undefined;

        if (!argOption.collisionTest)
            return argOption;

        const originalCollisionTest = argOption.collisionTest as any;
        const clonedOption: any = { ...argOption };
        clonedOption.collisionTest = (edge: Edge) => {
            const edgeMod = EdgePatcher.getEdgeMod(edge);
            if (!edgeMod.hasModifications())
                return originalCollisionTest(edge);

            const clonedEdge = edge.clone();
            edgeMod.applySensesTo(clonedEdge);
            clonedMap.set(edge, clonedEdge);
            return originalCollisionTest(clonedEdge);
        };
        return clonedOption;
    })();

    const result = wrapped.apply(this, [args[0], options]) as Set<Edge>;

    if (clonedMap.size === 0)
        return result;

    const finalResult = new Set<Edge>();
    for (const edge of result) {
        const originalEdge = clonedMap.get(edge);
        if (originalEdge)
            finalResult.add(originalEdge);
        else
            finalResult.add(edge);
    }

    return finalResult;
}
