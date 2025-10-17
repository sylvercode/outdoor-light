import { MODULE_ID, UPPER_MODULE_ID } from "src/ts/constants";
import { OutdoorLightStatus, OutdoorSceneFlagNames } from "src/ts/data/scene_ext";

const CHANGE_LIGHT_STATUS_TOOL_NAME = "changeLightStatus";

const LIGHTING_LAYER_NAME = foundry.canvas.layers.LightingLayer.layerOptions.name;

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

const TITLE_KEY = `${UPPER_MODULE_ID}.SceneControl.${LIGHTING_LAYER_NAME}.${CHANGE_LIGHT_STATUS_TOOL_NAME}.title`;

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
    })

    await changeLightStatusDialog.render({ force: true });
}
