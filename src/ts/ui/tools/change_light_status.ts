import { MODULE_ID, UPPER_MODULE_ID } from "src/ts/constants";
import { OutdoorLightStatus, OutdoorSceneFlagNames } from "src/ts/data/scene_ext";

/**
 * Name of the change light status tool.
 */
const CHANGE_LIGHT_STATUS_TOOL_NAME = "changeLightStatus";

/**
 * Name of the lighting layer.
 */
const LIGHTING_LAYER_NAME = foundry.canvas.layers.LightingLayer.layerOptions.name;

/**
 * Creates a SceneControls.Tool for changing the outdoor light status.
 * @param order The order of the tool in the scene controls.
 * @returns The SceneControls.Tool object.
 */
export function getChangeLightStatusTool(order: number): SceneControls.Tool {
    if (!game.i18n)
        throw new Error("i18n not initialized");

    return {
        name: CHANGE_LIGHT_STATUS_TOOL_NAME,
        title: TITLE_KEY,
        icon: "fas fa-traffic-light",
        order,
        button: true,
        onChange: onChangeLightStatusTool
    };
}

/**
 * Key for the title text of the change light status dialog.
 */
const TITLE_KEY = `${UPPER_MODULE_ID}.SceneControl.${LIGHTING_LAYER_NAME}.${CHANGE_LIGHT_STATUS_TOOL_NAME}.title`;

/**
 * Callback for the change light status tool button.
 * @param _event The event that triggered the callback.
 * @param _active Whether the tool is active.
 */
async function onChangeLightStatusTool(_event: Event, _active: boolean) {
    function localize(key: string) {
        if (!game.i18n)
            throw new Error("i18n not initialized");

        return game.i18n.localize(key);
    }

    function getLightStatusButton(status: OutdoorLightStatus) {
        return {
            action: status,
            label: localize(`${UPPER_MODULE_ID}.outdoorLightStatus.${status}`),
        };
    }

    const scene = game.canvas?.scene;
    if (!scene)
        throw new Error("No active scene");

    const changeLightStatusDialog = new foundry.applications.api.DialogV2({
        window: { title: localize(TITLE_KEY) },
        buttons: [
            getLightStatusButton(OutdoorLightStatus.bright),
            getLightStatusButton(OutdoorLightStatus.dim),
            getLightStatusButton(OutdoorLightStatus.off)
        ],
        submit: async result => {
            scene.update({
                flags: {
                    [MODULE_ID]: {
                        [OutdoorSceneFlagNames.outdoorLightStatus]: result as OutdoorLightStatus
                    }
                }
            });
        }
    });

    await changeLightStatusDialog.render({ force: true });
}
