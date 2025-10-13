import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import { DataSchema, StringField } from "fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * Enum for scene flag names related to outdoor blocking wall.
 */
export enum OutdoorSceneFlagNames {
    outdoorLightMode = "outdoorLightMode",
}

export enum OutdoorLightModes {
    manualGlobalLight = "manualGlobalLight",
    globalDarkness = "globalDarkness",
}

export type OutdoorLightMode = keyof typeof OutdoorLightModes;

class OutdoorLightModesField extends foundry.data.fields.StringField<typeof OutdoorLightModesField.Options> {
    constructor() {
        super(OutdoorLightModesField.Options);
    }
}

namespace OutdoorLightModesField {
    export const Options: StringField.Options<OutdoorLightModes> & { choices: Record<OutdoorLightMode, string> } = {
        choices: {
            [OutdoorLightModes.manualGlobalLight]: `${UPPER_MODULE_ID}.outdoorLightModes.manualGlobalLight`,
            [OutdoorLightModes.globalDarkness]: `${UPPER_MODULE_ID}.outdoorLightModes.globalDarkness`
        },
        nullable: true,
        initial: null
    }
}

/**
 * Interface for scene flags indicating outdoor blocking wall.
 */
export interface OutdoorSceneFlags {
    [OutdoorSceneFlagNames.outdoorLightMode]?: OutdoorLightMode;
}

declare module "fvtt-types/configuration" {
    interface FlagConfig {
        Scene: {
            [MODULE_ID]?: OutdoorSceneFlags;
        };
    }
}

/**
 * Data schema for outdoor scene flags.
 */
interface OutdoorSceneFlagsSchema extends DataSchema {
    [OutdoorSceneFlagNames.outdoorLightMode]: OutdoorLightModesField
}

/**
 * Data model for scene flags related to outdoor blocking wall.
 */
export class OutdoorSceneFlagsDataModel extends foundry.abstract.DataModel<OutdoorSceneFlagsSchema> {
    /**
     * Localization prefixes for this data model.
     */
    static override LOCALIZATION_PREFIXES = [`${UPPER_MODULE_ID}.OutdoorSceneFlags`];

    /**
     * Initializes i18n for this data model.
     */
    static i18nInit() {
        foundry.helpers.Localization.localizeDataModel(OutdoorSceneFlagsDataModel);
    }

    /**
     * Constructs a new OutdoorSceneFlagsDataModel for a given wall document.
     * @param sceneDocument The scene document to use for the data model.
     */
    constructor(sceneDocument: Scene) {
        super(sceneDocument.flags[MODULE_ID]);
        this.schema.name = MODULE_ID;
        this.schema.parent = sceneDocument.schema.fields.flags;
    }

    /**
     * Defines the schema for the outdoor scene flags.
     */
    static override defineSchema(): OutdoorSceneFlagsSchema {
        return {
            [OutdoorSceneFlagNames.outdoorLightMode]: new OutdoorLightModesField()
        };
    }
}

/**
 * Iterable of hook definitions for this data model.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [{
        name: "i18nInit",
        callback: OutdoorSceneFlagsDataModel.i18nInit
    }]
}];
