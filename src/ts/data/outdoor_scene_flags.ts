import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import { DataSchema, StringField } from "fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * Enum representing the available outdoor light modes.
 */
export enum OutdoorLightMode {
    manualGlobalLight = "manualGlobalLight",
    globalDarkness = "globalDarkness",
}

/**
 * Field for selecting an outdoor light mode.
 */
class OutdoorLightModesField extends foundry.data.fields.StringField<typeof OutdoorLightModesField.Options> {
    constructor() {
        super(OutdoorLightModesField.Options);
    }
}

/**
 * Namespace containing options for OutdoorLightModesField.
 */
namespace OutdoorLightModesField {
    /**
     * Options for OutdoorLightModesField, including choices and initial value.
     */
    export const Options: StringField.Options<OutdoorLightMode> & { choices: Record<keyof typeof OutdoorLightMode, string> } = {
        choices: {
            [OutdoorLightMode.manualGlobalLight]: `${UPPER_MODULE_ID}.outdoorLightModes.manualGlobalLight`,
            [OutdoorLightMode.globalDarkness]: `${UPPER_MODULE_ID}.outdoorLightModes.globalDarkness`
        },
        nullable: true,
        initial: null
    }
}

/**
 * Enum representing the status of outdoor light.
 */
export enum OutdoorLightStatus {
    bright = "bright",
    dim = "dim",
    off = "off",
}

/**
 * Field for selecting an outdoor light status.
 */
class OutdoorLightStatusField extends foundry.data.fields.StringField<typeof OutdoorLightStatusField.Options> {
    constructor() {
        super(OutdoorLightStatusField.Options);
    }
}

/**
 * Namespace containing options for OutdoorLightStatusField.
 */
namespace OutdoorLightStatusField {
    export const Options: StringField.Options<OutdoorLightStatus> & { choices: Record<keyof typeof OutdoorLightStatus, string> } = {
        choices: {
            [OutdoorLightStatus.bright]: `${UPPER_MODULE_ID}.outdoorLightStatus.bright`,
            [OutdoorLightStatus.dim]: `${UPPER_MODULE_ID}.outdoorLightStatus.dim`,
            [OutdoorLightStatus.off]: `${UPPER_MODULE_ID}.outdoorLightStatus.off`
        },
        required: true,
        initial: OutdoorLightStatus.bright
    }
}

/**
 * Enum for scene flag names related to outdoor light.
 */
export enum OutdoorSceneFlagNames {
    outdoorLightMode = "outdoorLightMode",
    outdoorLightStatus = "outdoorLightStatus",
}

/**
 * Interface for scene flags indicating outdoor light.
 */
export interface OutdoorSceneFlags {
    /**
     * The mode of outdoor light for the scene.
     */
    [OutdoorSceneFlagNames.outdoorLightMode]?: OutdoorLightMode;
    /**
     * The status of outdoor light for the scene.
     */
    [OutdoorSceneFlagNames.outdoorLightStatus]?: OutdoorLightStatus;
}

/**
 * Module augmentation for FVTT flag configuration.
 */
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
    /**
     * Field for outdoor light mode.
     */
    [OutdoorSceneFlagNames.outdoorLightMode]: OutdoorLightModesField
    /**
     * Field for outdoor light status.
     */
    [OutdoorSceneFlagNames.outdoorLightStatus]: OutdoorLightStatusField
}

/**
 * Data model for scene flags related to outdoor light.
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
     * Constructs a new OutdoorSceneFlagsDataModel for a given scene document.
     * @param sceneDocument The scene document to use for the data model.
     */
    constructor(sceneDocument: Scene) {
        super(sceneDocument.flags[MODULE_ID]);
        this.schema.name = MODULE_ID;
        this.schema.parent = sceneDocument.schema.fields.flags;
    }

    /**
     * Defines the schema for the outdoor scene flags.
     * @returns The schema for outdoor scene flags.
     */
    static override defineSchema(): OutdoorSceneFlagsSchema {
        return {
            [OutdoorSceneFlagNames.outdoorLightMode]: new OutdoorLightModesField(),
            [OutdoorSceneFlagNames.outdoorLightStatus]: new OutdoorLightStatusField()
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
