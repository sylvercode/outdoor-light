import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import type { BooleanField, DataSchema, NumberField, SchemaField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import { EnumField, EnumFieldOptions } from "../utils/enum_field";

/**
 * Enum for wall flag names related to outdoor blocking wall.
 */
export enum OutdoorWallFlagName {
    isBlockingOutdoorLight = "isBlockingOutdoorLight",
    lightEmission = "lightEmission"
}

/**
 * Enum for light emission data keys.
 */
export enum LightEmissionKey {
    side = "side",
    dim = "dim",
    bright = "bright",
    units = "units"
}

/**
 * Enum for light emission sides.
 */
export enum LightEmissionSide {
    none = "none",
    left = "left",
    right = "right"
}

/**
 * Enum for light emission units.
 */
export enum LightEmissionUnits {
    wallLengthProportionalRatio = "wallLengthProportionalRatio",
    feets = "feets"
}

/**
 * Interface for light emission data.
 */
export type LightEmissionData = {
    [LightEmissionKey.side]?: LightEmissionSide;
    [LightEmissionKey.dim]?: number;
    [LightEmissionKey.bright]?: number;
    [LightEmissionKey.units]?: LightEmissionUnits;
};

/**
 * Interface for wall flags indicating outdoor blocking wall.
 */
export interface OutdoorWallFlags {
    [OutdoorWallFlagName.isBlockingOutdoorLight]?: boolean;
    [OutdoorWallFlagName.lightEmission]?: LightEmissionData;
}

/**
 * Module augmentation for FVTT flag configuration.
 */
declare module "fvtt-types/configuration" {
    interface FlagConfig {
        Wall: {
            [MODULE_ID]?: OutdoorWallFlags;
        };
    }
}

/**
 * Field options for light emission data schema.
 */
const LightEmissionSideFieldOptions: EnumFieldOptions<LightEmissionSide, typeof LightEmissionSide> = {
    choices: {
        [LightEmissionSide.none]: `${UPPER_MODULE_ID}.LightEmissionSide.${LightEmissionSide.none}`,
        [LightEmissionSide.left]: `${UPPER_MODULE_ID}.LightEmissionSide.${LightEmissionSide.left}`,
        [LightEmissionSide.right]: `${UPPER_MODULE_ID}.LightEmissionSide.${LightEmissionSide.right}`
    },
    initial: LightEmissionSide.none,
    required: true
}

/**
 * Field options for light emission dim and bright.
 */
const LightEmissionDimBrightFieldOptions: NumberField.Options = {
    min: 0,
    required: true
}

/**
 * Field options for light emission units.
 */
const LightEmissionUnitsFieldOptions: EnumFieldOptions<LightEmissionUnits, typeof LightEmissionUnits> = {
    choices: {
        [LightEmissionUnits.wallLengthProportionalRatio]: `${UPPER_MODULE_ID}.LightEmissionUnits.${LightEmissionUnits.wallLengthProportionalRatio}`,
        [LightEmissionUnits.feets]: `${UPPER_MODULE_ID}.LightEmissionUnits.${LightEmissionUnits.feets}`
    },
    initial: LightEmissionUnits.wallLengthProportionalRatio,
    required: true
}

/**
 * Data schema for light emission settings.
 */
export interface LightEmissionDataSchema extends DataSchema {
    [LightEmissionKey.side]: EnumField<LightEmissionSide, typeof LightEmissionSide>;
    [LightEmissionKey.dim]: NumberField<typeof LightEmissionDimBrightFieldOptions>;
    [LightEmissionKey.bright]: NumberField<typeof LightEmissionDimBrightFieldOptions>;
    [LightEmissionKey.units]: EnumField<LightEmissionUnits, typeof LightEmissionUnits>;
}

/**
 * Data schema for outdoor wall flags.
 */
interface OutdoorWallFlagsSchema extends DataSchema {
    [OutdoorWallFlagName.isBlockingOutdoorLight]: BooleanField
    [OutdoorWallFlagName.lightEmission]: SchemaField<LightEmissionDataSchema>;
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
            [OutdoorWallFlagName.isBlockingOutdoorLight]: new foundry.data.fields.BooleanField(),
            [OutdoorWallFlagName.lightEmission]: new foundry.data.fields.SchemaField<LightEmissionDataSchema>({
                [LightEmissionKey.side]: new EnumField(LightEmissionSideFieldOptions),
                [LightEmissionKey.dim]: new foundry.data.fields.NumberField(LightEmissionDimBrightFieldOptions),
                [LightEmissionKey.bright]: new foundry.data.fields.NumberField(LightEmissionDimBrightFieldOptions),
                [LightEmissionKey.units]: new EnumField(LightEmissionUnitsFieldOptions)
            })
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
    if (change.flags?.[MODULE_ID]?.[OutdoorWallFlagName.isBlockingOutdoorLight] === undefined)
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
