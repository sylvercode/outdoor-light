import { MODULE_ID, UPPER_MODULE_ID } from "./constants";

enum SettingName {
    changeDefaultLightAttenuation = "changeDefaultLightAttenuation",
    defaultLightAttenuationValue = "defaultLightAttenuationValue"
}

const defaultLightAttenuationValueFieldOptions = { step: 0.05, initial: 0.6 };

declare module "fvtt-types/configuration" {
    interface SettingConfig {
        "outdoor-light.changeDefaultLightAttenuation": foundry.data.fields.BooleanField;
        "outdoor-light.defaultLightAttenuationValue": foundry.data.fields.AlphaField<typeof defaultLightAttenuationValueFieldOptions>;
    }
}

function registerSettings() {
    if (!game.settings) throw new Error("Game settings not initialized");
    if (!game.i18n) throw new Error("Game i18n not initialized");

    game.settings.register(MODULE_ID, SettingName.changeDefaultLightAttenuation, {
        name: game.i18n.localize(`${UPPER_MODULE_ID}.settings.${SettingName.changeDefaultLightAttenuation}.name`),
        hint: game.i18n.localize(`${UPPER_MODULE_ID}.settings.${SettingName.changeDefaultLightAttenuation}.hint`),
        scope: "world",
        config: true,
        type: new foundry.data.fields.BooleanField()
    });

    game.settings.register(MODULE_ID, SettingName.defaultLightAttenuationValue, {
        name: game.i18n.localize(`${UPPER_MODULE_ID}.settings.${SettingName.defaultLightAttenuationValue}.name`),
        hint: game.i18n.localize(`${UPPER_MODULE_ID}.settings.${SettingName.defaultLightAttenuationValue}.hint`),
        scope: "world",
        config: true,
        type: new foundry.data.fields.AlphaField(defaultLightAttenuationValueFieldOptions)
    });
}

/**
 * onInit callback for registering module settings.
 */
export const onInitHandle = registerSettings;

/**
 * Class for outdoor light settings.
 */
class OutdoorLightSettings {

    /**
     * Gets the default light attenuation value from settings if activated.
     * @returns {number} The default light attenuation value.
     */
    defaultLightAttenuationValue(): number | null {
        if (!game.settings)
            throw new Error("Game settings not initialized");

        if (!game.settings.get(MODULE_ID, SettingName.changeDefaultLightAttenuation)) {
            return null;
        }

        return game.settings.get(MODULE_ID, SettingName.defaultLightAttenuationValue) ?? defaultLightAttenuationValueFieldOptions.initial;
    }
}

/**
 * Singleton instance for accessing Outdoor Light settings.
 */
export const outdoorLightSettings = new OutdoorLightSettings();
