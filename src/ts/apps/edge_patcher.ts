import Edge from "node_modules/fvtt-types/src/foundry/client/canvas/geometry/edges/edge.mjs";
import { OutdoorLightFlagName } from "../data/ambient_light_ext";
import { OutdoorWallFlagName } from "../data/wall_ext";
import { MODULE_ID } from "../constants";

/**
 * Edge modification logic based on wall and light properties.
 */
export namespace EdgePatcher {
    /**
     * Determines the edge modifications based on wall properties.
     * @param edge The edge to evaluate
     * @returns The EdgeModification instance with determined modifications
     */
    export function getEdgeMod(edge: Edge): EdgeModification {
        const wallDoc = getWallDoc(edge);
        if (!wallDoc)
            return new EdgeModification();

        const result = new EdgeModification(wallDoc);

        if (wallDoc.getFlag(MODULE_ID, OutdoorWallFlagName.isCurtain) && wallDoc.door !== CONST.WALL_DOOR_TYPES.NONE) {
            if (wallDoc.ds !== CONST.WALL_DOOR_STATES.OPEN) {
                result.light = SenseModification.SET_NORMAL;
                result.sight = SenseModification.SET_NORMAL;
            }
            else {
                result.light = SenseModification.REVERT_FROM_DOC;
                result.sight = SenseModification.REVERT_FROM_DOC;
                result.move = SenseModification.REVERT_FROM_DOC;
            }
        }

        return result;
    }

    /**
     * Determines the edge modifications for outdoor light based on wall and light properties.
     * @param edge The edge to evaluate
     * @param csp The ClockwiseSweepPolygon instance
     * @returns The EdgeModification instance with determined modifications
     */
    export function getEdgeModForLight(edge: Edge, csp: ClockwiseSweepPolygonLight): EdgeModification {
        const wallDoc = getWallDoc(edge);
        if (!wallDoc)
            return new EdgeModification();

        const result = new EdgeModification(wallDoc);

        const lightInfo = getLightDoc(csp);
        if (!lightInfo)
            return result;

        if (wallDoc.getFlag(MODULE_ID, OutdoorWallFlagName.lightEmission)?.lightId === lightInfo?.id)
            result.light = SenseModification.SET_NONE;
        else if (wallDoc.getFlag(MODULE_ID, OutdoorWallFlagName.isBlockingOutdoorLight) && lightInfo.getFlag(MODULE_ID, OutdoorLightFlagName.isOutdoor))
            result.light = SenseModification.SET_NORMAL;

        return result;
    }

    /**
     * Checks if the ClockwiseSweepPolygon is for a light source.
     * @param csp The ClockwiseSweepPolygon instance
     * @returns True if the CSP is for a light source, false otherwise
     */
    export function isClockwiseSweepPolygonLight(csp: ClockwiseSweepPolygon): csp is ClockwiseSweepPolygonLight {
        return csp.config.type === "light";
    }

    /**
     * ClockwiseSweepPolygon type for light sources.
     */
    type ClockwiseSweepPolygonLight = ClockwiseSweepPolygon & { config: { type: "light" } }
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
                    const threshold = (() => {
                        if (type === "move")
                            return null;
                        const docThreshold = this.wallDoc.threshold?.[type] ?? null;
                        if (!docThreshold)
                            return null;
                        const scene = this.wallDoc.parent;
                        if (!scene)
                            return null;
                        const distancePixels = scene.dimensions.distancePixels;
                        return docThreshold * distancePixels;
                    })();
                    return { sens: docSens, threshold };
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
     * Retrieves the ambient light document and its outdoor flags from the ClockwiseSweepPolygon.
     * @param csp The ClockwiseSweepPolygon instance
     * @returns An object containing the ambient light document and its outdoor flags, or null if not applicable
     */
    function getLightDoc(csp: ClockwiseSweepPolygonLight): AmbientLightDocument | null {
        const ambientLight = csp.config.source?.object;
        if (!(ambientLight instanceof foundry.canvas.placeables.AmbientLight))
            return null;

        //const dataModel = new OutdoorLightFlagsDataModel(ambientLight.document);
        return ambientLight.document;
    }

    /**
     * Retrieves the wall document and its outdoor flags from the given edge.
     * @param edge The edge to evaluate
     * @returns An object containing the wall document and its outdoor flags, or null if not applicable
     */
    function getWallDoc(edge: Edge): WallDocument | null {
        const doc = edge.object?.document;
        if (!(doc instanceof WallDocument))
            return null;

        return doc;
    }
}
