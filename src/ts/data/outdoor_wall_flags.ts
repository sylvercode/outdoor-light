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
 * Iterable of hook definitions for this data model.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "i18nInit",
        callback: OutdoorWallFlagsDataModel.i18nInit
    }]
}];
