import * as dogBrowserApp from "./apps/dog_browser";
import * as PingNotifier from "./apps/ping_notifer";
import type { LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import { HookDefinitions } from "fvtt-hook-attacher";

/**
 * Interface for the Outdoor Light module, extending Foundry's Module interface.
 */
export interface OutdoorLightModule

  extends foundry.packages.Module, dogBrowserApp.DogBrowserHandle {

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
    dogBrowserApp.onInitHandle,
  ];

  /**
   * Iterable of libWrapper patch definitions to be registered.
   */
  static LIBWRAPPER_PATCHS: Iterable<LibWrapperWrapperDefinitions> = [
    ...PingNotifier.LIBWRAPPER_PATCHS,
  ];

  /**
   * Set of hook definitions to be attached.
   */
  static HOOKS_DEFINITIONS_SET: Iterable<HookDefinitions> = [
    ...dogBrowserApp.HOOKS_DEFINITIONS,
  ]
}

