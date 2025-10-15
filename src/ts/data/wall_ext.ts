import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import type { BooleanField, DataSchema } from "fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * Enum for wall flag names related to outdoor blocking wall.
 */
export enum OutdoorWallFlagNames {
    isBlockingOutdoorLight = "isBlockingOutdoorLight",
}

/**
 * Interface for wall flags indicating outdoor blocking wall.
 */
export interface OutdoorWallFlags {
    [OutdoorWallFlagNames.isBlockingOutdoorLight]?: boolean;
}

declare module "fvtt-types/configuration" {
    interface FlagConfig {
        Wall: {
            [MODULE_ID]?: OutdoorWallFlags;
        };
    }
}

/**
 * Data schema for outdoor wall flags.
 */
interface OutdoorWallFlagsSchema extends DataSchema {
    [OutdoorWallFlagNames.isBlockingOutdoorLight]: BooleanField
}

/**
 * Data model for wall flags related to outdoor blocking wall.
 */
export class OutdoorWallFlagsDataModel extends foundry.abstract.DataModel<OutdoorWallFlagsSchema> {
    /**
     * Localization prefixes for this data model.
     */
    static override LOCALIZATION_PREFIXES = [`${UPPER_MODULE_ID}.OutdoorWallFlags`];

    /**
     * Initializes i18n for this data model.
     */
    static i18nInit() {
        foundry.helpers.Localization.localizeDataModel(OutdoorWallFlagsDataModel);
    }

    /**
     * Constructs a new OutdoorWallFlagsDataModel for a given wall document.
     * @param wallDocument The wall document to use for the data model.
     */
    constructor(wallDocument: WallDocument) {
        super(wallDocument.flags[MODULE_ID]);
        this.schema.name = MODULE_ID;
        this.schema.parent = wallDocument.schema.fields.flags;
    }

    /**
     * Defines the schema for the outdoor wall flags.
     */
    static override defineSchema(): OutdoorWallFlagsSchema {
        return {
            [OutdoorWallFlagNames.isBlockingOutdoorLight]: new foundry.data.fields.BooleanField()
        };
    }
}

/**
 * Callback for the updateWall hook, triggers a refresh of the lighting and vision system if the outdoor blocking wall flag changes.
 * @param _document The wall document being updated.
 * @param change The changes being applied to the wall document.
 * @param _options The update options.
 * @param _userId The ID of the user performing the update.
 */
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

/**
 * Iterable of hook definitions for this data model.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [
        {
            name: "i18nInit",
            callback: OutdoorWallFlagsDataModel.i18nInit
        },
        {
            name: "updateWall",
            callback: updateWall
        }
    ]
}];
