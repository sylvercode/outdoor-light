import { HookDefinitions } from "fvtt-hook-attacher";
import type { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import AmbientLightTab from "fvtt-types/src/foundry/client/applications/sidebar/tabs/ambient-light-tab.mjs";

/**
 * LibWrapper patch definitions for ClockwiseSweepPolygon edge inclusion test logic.
 */
export const LIBWRAPPER_PATCHES: Iterable<LibWrapperWrapperDefinitions> = [
    {
        target: "foundry.applications.sidebar.tabs.AmbientLightTab.prototype._matchesFilter",
        fn: _matchesFilter_Wrapper,
        type: "MIXED"
    }
];

/**
 * Iterable of hook definitions for tools addition.
 */
export const HOOKS_DEFINITIONS: Iterable<HookDefinitions> = [{
    on: [
        {
            name: "deactivateLightingLayer",
            callback: deactivateLightingLayer
        },
        {
            name: "renderPlaceableTab",
            callback: renderPlaceableTab
        }
    ]
}];

let _matchesFilter_Wrapper_Active = false;

function _matchesFilter_Wrapper(this: AmbientLightTab, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): boolean {
    if (_matchesFilter_Wrapper_Active &&
        ui.controls?.control?.name === 'lighting') {
        const lightDoc = args[0] as AmbientLightDocument;
        const isOutdoor = lightDoc.flags["outdoor-light"]?.isOutdoor ?? false;
        const isOutdoorLayerActive = ui.controls?.tools["toggleOutdoorLayer"].active ?? false;
        if (isOutdoor != isOutdoorLayerActive) {
            return false;
        }
    }

    return wrapped.apply(this, args);
}

function deactivateLightingLayer(): void {
    _matchesFilter_Wrapper_Active = false;
    ui.placeables?.tab?._applyFilters();
}

function renderPlaceableTab(): void {
    _matchesFilter_Wrapper_Active = true;
    ui.placeables?.tab?._applyFilters();
}
