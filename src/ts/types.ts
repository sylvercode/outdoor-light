import type { LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import { HookDefinitions } from "fvtt-hook-attacher";
import * as RenderWallConfigPatch from "./ui/dialog/wall_config_ext";
import * as RenderAmbientLightConfigPatch from "./ui/dialog/ambient_light_config_ext";
import * as RenderSceneConfigPatch from "./ui/dialog/scene_config_ext";
import * as OutdoorLightFlagsDataModel from "./data/ambient_light_ext";
import * as OutdoorWallFlagsDataModel from "./data/wall_ext";
import * as OutdoorSceneFlagsDataModel from "./data/scene_ext";
import * as ClockwiseSweepPolygonPatch from "./apps/clockwise_sweep_polygon_ext";
import * as LightingLayerTools from "./ui/tools/lighting_layer_tools_ext";
import * as ToggleOutdoorLayer from "./ui/tools/toogle_outdoor_layer";
import * as WallsLayerTools from "./ui/tools/walls_layer_tools_ext";
import * as settings from "./settings";

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
    settings.onInitHandle
  ];

  /**
   * Iterable of libWrapper patch definitions to be registered.
   */
  static LIBWRAPPER_PATCHS: Iterable<LibWrapperWrapperDefinitions> = [
    ...ClockwiseSweepPolygonPatch.LIBWRAPPER_PATCHS,
    ...WallsLayerTools.LIBWRAPPER_PATCHS,
    ...ToggleOutdoorLayer.LIBWRAPPER_PATCHS,
  ];

  /**
   * Set of hook definitions to be attached.
   */
  static HOOKS_DEFINITIONS_SET: Iterable<HookDefinitions> = [
    ...RenderWallConfigPatch.HOOKS_DEFINITIONS,
    ...RenderAmbientLightConfigPatch.HOOKS_DEFINITIONS,
    ...RenderSceneConfigPatch.HOOKS_DEFINITIONS,
    ...OutdoorWallFlagsDataModel.HOOKS_DEFINITIONS,
    ...OutdoorLightFlagsDataModel.HOOKS_DEFINITIONS,
    ...OutdoorSceneFlagsDataModel.HOOKS_DEFINITIONS,
    ...WallsLayerTools.HOOKS_DEFINITIONS,
    ...LightingLayerTools.HOOKS_DEFINITIONS,
    ...ToggleOutdoorLayer.HOOKS_DEFINITIONS
  ]
}
