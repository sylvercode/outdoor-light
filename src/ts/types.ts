import type { LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import { HookDefinitions } from "fvtt-hook-attacher";
import * as RenderWallConfigPatch from "./ui/render_wall_config_patch";
import * as RenderAmbientLightConfigPatch from "./ui/render_ambient_light_config_patch";
import * as WallDocumentHook from "./data/wall_document_hook";
import * as OutdoorWallFlagsDataModel from "./data/outdoor_wall_flags";
import * as OutdoorLightFlagsDataModel from "./data/outdoor_light_flags";
import * as ClockwiseSweepPolygonPatch from "./apps/clockwise_sweep_polygon_patch";
import * as LightingLayerTools from "./ui/lighting_layer_tools";
import * as WallsLayerTools from "./ui/walls_layer_tools";

/**
 * Interface for the Outdoor Light module, extending Foundry's Module interface.
 */
export interface OutdoorLightModule

  extends foundry.packages.Module {

}

/**
 * Callback type for module initialization.
 */
export type OnInitModuleFunc = (module: OutdoorLightModule) => void;

/**
 * Contains static properties for module hooks, libWrapper patches, and hook definitions.
 */
export class OutdoorLightModuleHooks {
  /**
   * Iterable of callbacks to be called on module initialization.
   */
  static ON_INIT_MODULE_CALLBACKS: Iterable<OnInitModuleFunc> = [
  ];

  /**
   * Iterable of libWrapper patch definitions to be registered.
   */
  static LIBWRAPPER_PATCHS: Iterable<LibWrapperWrapperDefinitions> = [
    ...ClockwiseSweepPolygonPatch.LIBWRAPPER_PATCHS,
    ...WallsLayerTools.LIBWRAPPER_PATCHS,
    ...LightingLayerTools.LIBWRAPPER_PATCHS,
  ];

  /**
   * Set of hook definitions to be attached.
   */
  static HOOKS_DEFINITIONS_SET: Iterable<HookDefinitions> = [
    ...WallDocumentHook.HOOKS_DEFINITIONS,
    ...RenderWallConfigPatch.HOOKS_DEFINITIONS,
    ...RenderAmbientLightConfigPatch.HOOKS_DEFINITIONS,
    ...OutdoorWallFlagsDataModel.HOOKS_DEFINITIONS,
    ...OutdoorLightFlagsDataModel.HOOKS_DEFINITIONS,
    ...WallsLayerTools.HOOKS_DEFINITIONS,
    ...LightingLayerTools.HOOKS_DEFINITIONS,
  ]
}
