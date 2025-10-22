import { MODULE_ID, UPPER_MODULE_ID } from "../constants";
import type { HookDefinitions } from "fvtt-hook-attacher";
import type { BooleanField, DataSchema, NumberField, SchemaField, StringField } from "fvtt-types/src/foundry/common/data/fields.mjs";
import { EnumField, EnumFieldOptions } from "../utils/enum_field";
import updateWallLightEmission from "../apps/update_wall_light_emission";

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
    units = "units",
    lightId = "lightId"
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
    [LightEmissionKey.lightId]?: string | null;
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
    [LightEmissionKey.lightId]: StringField;
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
                [LightEmissionKey.units]: new EnumField(LightEmissionUnitsFieldOptions),
                [LightEmissionKey.lightId]: new foundry.data.fields.StringField()
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
async function updateWall(
    document: WallDocument,
    change: WallDocument.UpdateData,
    _options: WallDocument.Database.UpdateOptions,
    _userId: string,
): Promise<void> {
    if (change.flags?.[MODULE_ID]?.isBlockingOutdoorLight !== undefined) {
        game.canvas?.perception.update({
            refreshEdges: true,         // Recompute edge intersections
            initializeLighting: true,   // Recompute light sources
            initializeVision: true,     // Recompute vision sources
            initializeSounds: true      // Recompute sound sources
        });
    }

    const mustUpdateLightEmission = (() => {
        const lightEmissionFlag = change.flags?.[MODULE_ID]?.lightEmission;
        if (lightEmissionFlag)
            return true;

        const side = document?.flags?.[MODULE_ID]?.lightEmission?.side ?? LightEmissionSide.none;
        if (side === LightEmissionSide.none)
            return false;

        return change.c !== undefined || change.door !== undefined || change.ds !== undefined;
    })();
    if (mustUpdateLightEmission) {
        const lightId = await updateWallLightEmission(document);
        const idInWall = document.flags[MODULE_ID]?.lightEmission!.lightId;
        if (idInWall !== lightId) {
            await document.update({
                flags: {
                    [MODULE_ID]: {
                        lightEmission: {
                            lightId: lightId
                        }
                    }
                }
            });
        }
    }
}

/**
 * Callback for the deleteWall hook, deletes the associated light emission ambient light if it exists.
 * @param document The wall document being deleted.
 */
async function deleteWall(document: WallDocument) {
    const outdoorWallFlags = new OutdoorWallFlagsDataModel(document);
    const lightId = outdoorWallFlags.lightEmission?.lightId;
    if (lightId)
        document.parent?.deleteEmbeddedDocuments("AmbientLight", [lightId]);
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
        },
        {
            name: "deleteWall",
            callback: deleteWall
        }
    ]
}];
