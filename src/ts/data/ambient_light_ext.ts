import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import type { BooleanField, DataSchema, StringField } from "fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * Enum for outdoor ambient light flag names.
 */
export enum OutdoorLightFlagName {
    isOutdoor = "isOutdoor",
    emissionWallId = "emissionWallId"
}

/**
 * Interface for outdoor ambient light flags.
 */
export interface OutdoorLightFlags {
    [OutdoorLightFlagName.isOutdoor]?: boolean;
    [OutdoorLightFlagName.emissionWallId]?: string;
}

declare module "fvtt-types/configuration" {
    interface FlagConfig {
        AmbientLight: {
            [MODULE_ID]?: OutdoorLightFlags;
        };
    }
}

/**
 * Data schema for outdoor light flags.
 */
interface OutdoorLightFlagsSchema extends DataSchema {
    [OutdoorLightFlagName.isOutdoor]: BooleanField
    [OutdoorLightFlagName.emissionWallId]: StringField
}

/**
 * Data model for outdoor ambient light flags.
 */
export class OutdoorLightFlagsDataModel extends foundry.abstract.DataModel<OutdoorLightFlagsSchema> {
    /**
     * Localization prefixes for this data model.
     */
    static override LOCALIZATION_PREFIXES = [`${UPPER_MODULE_ID}.OutdoorLightFlags`];

    /**
     * Initializes i18n for this data model.
     */
    static i18nInit() {
        foundry.helpers.Localization.localizeDataModel(OutdoorLightFlagsDataModel);
    }

    /**
     * Constructs a new OutdoorLightFlagsDataModel for a given ambient light document.
     * @param lightDocument The ambient light document to use for the data model.
     */
    constructor(lightDocument: AmbientLightDocument) {
        super(lightDocument.flags[MODULE_ID]);
        this.schema.name = MODULE_ID;
        this.schema.parent = lightDocument.schema.fields.flags;
    }

    /**
     * Defines the schema for the outdoor light flags.
     */
    static override defineSchema(): OutdoorLightFlagsSchema {
        return {
            [OutdoorLightFlagName.isOutdoor]: new foundry.data.fields.BooleanField(),
            [OutdoorLightFlagName.emissionWallId]: new foundry.data.fields.StringField()
        };
    }
}

/**
 * Iterable of hook definitions for this data model.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "i18nInit",
        callback: OutdoorLightFlagsDataModel.i18nInit
    }]
}];
