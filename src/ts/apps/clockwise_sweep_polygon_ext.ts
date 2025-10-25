import type { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import type { Edge } from "fvtt-types/src/foundry/client/canvas/geometry/edges/_module.mjs";
import { OutdoorWallFlagsDataModel } from "../data/wall_ext";
import { OutdoorLightFlagsDataModel } from "../data/ambient_light_ext";

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
    for (const edge of csp.edges) {
        const wallMod = getWallMod(csp, edge);
        if (wallMod.hasModifications())
            wallMod.applySensesTo(edge);
    }
}

/**
 * Sense modification types.
 */
enum SenseModification {
    UNCHANGED,
    REVERT_FROM_DOC,
    SET_NONE,
    SET_NORMAL
}

/**
 * Sense and threshold pair.
 */
type SenseAndThreshold = {
    sens: CONST.WALL_SENSE_TYPES,
    threshold: number | null
}

/**
 * Edge modification information.
 */
class EdgeModification {
    /**
     * Constructor.
     * @param wallDoc The wall document of the edge to modify
     */
    constructor(private wallDoc: WallDocument | null = null) { }

    /**
     * Modifications for move restriction.
     */
    move: SenseModification = SenseModification.UNCHANGED;

    /**
     * Modifications for light restriction.
     */
    light: SenseModification = SenseModification.UNCHANGED;

    /**
     * Modifications for sight restriction.
     */
    sight: SenseModification = SenseModification.UNCHANGED;

    /**
     * Checks if any modifications are present.
     * @returns True if modifications are present, false otherwise.
     */
    hasModifications(): boolean {
        return this.light !== SenseModification.UNCHANGED
            || this.sight !== SenseModification.UNCHANGED
            || this.move !== SenseModification.UNCHANGED
    }

    /**
     * Gets the modified sense and threshold for a given restriction type.
     * @param type The restriction type ("light", "sight", or "move")
     * @param current The current edge sense with threshold
     * @returns The sense and threshold to apply
     */
    getSensFor(type: "light" | "sight" | "move", current: SenseAndThreshold)
        : SenseAndThreshold {
        const mod = this[type];
        switch (mod) {
            case SenseModification.SET_NONE:
                return { sens: CONST.WALL_SENSE_TYPES.NONE, threshold: null };
            case SenseModification.SET_NORMAL:
                return { sens: CONST.WALL_SENSE_TYPES.NORMAL, threshold: null };
            case SenseModification.REVERT_FROM_DOC:
                if (!this.wallDoc)
                    return current;
                const docSens = this.wallDoc[type] as CONST.WALL_SENSE_TYPES;
                const docThreshold = type !== "move" ? this.wallDoc.threshold?.[type] ?? null : null;
                return { sens: docSens, threshold: docThreshold };
            default:
                return current;
        }
    }

    /**
     * Applies the sense modification to the given edge for the specified restriction type.
     * @param type The restriction type ("light", "sight", or "move")
     * @param edge The edge to modify
     */
    applySenseTo(type: "light" | "sight" | "move", edge: Edge): void {
        const curThreshold = type !== "move" ? edge.threshold?.[type] ?? null : null;
        const current = { sens: edge[type], threshold: curThreshold };
        const newSens = this.getSensFor(type, current);
        edge[type] = newSens.sens;
        if (type !== "move" && edge.threshold?.[type] !== undefined)
            edge.threshold[type] = newSens.threshold;
    }

    /**
     * Applies all sense modifications to the given edge.
     * @param edge The edge to modify
     */
    applySensesTo(edge: Edge): void {
        this.applySenseTo("light", edge);
        this.applySenseTo("sight", edge);
        this.applySenseTo("move", edge);
    }
}

/**
 * Determines the edge modifications based on wall and light properties.
 * @param csp The ClockwiseSweepPolygon instance
 * @param edge The edge to evaluate
 * @returns The EdgeModification instance with determined modifications
 */
function getWallMod(csp: ClockwiseSweepPolygon, edge: Edge): EdgeModification {

    const wallInfo = getWallDocWithOutdoorFlags(edge);
    if (!wallInfo)
        return new EdgeModification();

    const result = new EdgeModification(wallInfo.doc);

    if (wallInfo?.flags?.isCurtain && wallInfo.doc.door !== CONST.WALL_DOOR_TYPES.NONE) {
        if (wallInfo.doc.ds !== CONST.WALL_DOOR_STATES.OPEN) {
            result.light = SenseModification.SET_NORMAL;
            result.sight = SenseModification.SET_NORMAL;
        }
        else {
            result.light = SenseModification.REVERT_FROM_DOC;
            result.sight = SenseModification.REVERT_FROM_DOC;
            result.move = SenseModification.REVERT_FROM_DOC;
        }
    }

    const lightInfo = getLightDocWithOutdoorFlags(csp);

    if (wallInfo?.flags.lightEmission.lightId === lightInfo?.doc.id)
        result.light = SenseModification.SET_NONE;
    else if (wallInfo?.flags.isBlockingOutdoorLight && lightInfo?.flags.isOutdoor)
        result.light = SenseModification.SET_NORMAL;

    return result;
}

/**
 * Returns a possibly modified Edge for testing, depending on outdoor light and border status.
 * @param csp The ClockwiseSweepPolygon instance
 * @param edge The edge to test
 * @returns The original or modified Edge
 */
function getTestEdge(csp: ClockwiseSweepPolygon, edge: Edge): Edge {
    const wallMod = getWallMod(csp, edge);
    if (!wallMod.hasModifications())
        return edge;

    const clonedEdge = edge.clone();
    wallMod.applySensesTo(clonedEdge);
    return clonedEdge;
}

/**
 * Retrieves the ambient light document and its outdoor flags from the ClockwiseSweepPolygon.
 * @param csp The ClockwiseSweepPolygon instance
 * @returns An object containing the ambient light document and its outdoor flags, or null if not applicable
 */
function getLightDocWithOutdoorFlags(csp: ClockwiseSweepPolygon): { doc: AmbientLightDocument, flags: OutdoorLightFlagsDataModel } | null {
    const ambientLight = csp.config.source?.object;
    if (!(ambientLight instanceof foundry.canvas.placeables.AmbientLight))
        return null;

    const dataModel = new OutdoorLightFlagsDataModel(ambientLight.document);
    return { doc: ambientLight.document, flags: dataModel };
}

/**
 * Retrieves the wall document and its outdoor flags from the given edge.
 * @param edge The edge to evaluate
 * @returns An object containing the wall document and its outdoor flags, or null if not applicable
 */
function getWallDocWithOutdoorFlags(edge: Edge): { doc: WallDocument, flags: OutdoorWallFlagsDataModel } | null {
    const doc = edge.object?.document;
    if (!(doc instanceof WallDocument))
        return null;

    return { doc: doc, flags: new OutdoorWallFlagsDataModel(doc) };
}
