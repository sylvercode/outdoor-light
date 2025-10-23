import { OutdoorLightMode, OutdoorLightStatus, OutdoorSceneFlagsDataModel } from "../data/scene_ext";
import { LightEmissionUnits, OutdoorWallFlagsDataModel } from "../data/wall_ext";
import { AmbientLightProxy } from "../proxies/ambient_light_proxy";
import { outdoorLightSettings } from "../settings";
import wallCoordAsRay from "../utils/wall_doc_as_ray";

/**
 * Options for applying default outdoor light settings.
 */
export type Options = { luminosity?: boolean, attenuation?: boolean, maxDarkness?: boolean, brightDimHidden?: boolean };

/**
 * Default options for applying outdoor light settings.
 */
const DEFAULT_OPTIONS: { [K in keyof Required<Options>]: true } = {
    luminosity: true,
    attenuation: true,
    maxDarkness: true,
    brightDimHidden: true
};

/**
 * Applies default outdoor light settings to AmbientLight based on the Scene Flags.
 * @param light The AmbientLightProxy to apply settings to.
 * @param options Options to control which settings to apply. Defaults to all true.
 */
export default function applyDefaultOutdoorLightSettings(light: AmbientLightProxy, options: Options = DEFAULT_OPTIONS): void {
    const scene = light.getScene();
    const outdoorSceneFlags = new OutdoorSceneFlagsDataModel(scene);

    if (!outdoorSceneFlags.outdoorLightMode)
        return;

    if (options.brightDimHidden) {
        const emissionWall = getEmissionWall(light);
        if (!emissionWall) {
            if (outdoorSceneFlags.outdoorLightStatus === OutdoorLightStatus.dim) {
                light.setDim(Math.max(light.getBright(), light.getDim()));
                light.setBright(0);
            }
            else {
                light.setBright(Math.max(light.getBright(), light.getDim()));
                light.setDim(0);
            }
        }
        else {
            const wallLightRadius = getLightRadius(emissionWall, scene.dimensions.distancePixels);
            if (outdoorSceneFlags.outdoorLightStatus === OutdoorLightStatus.dim) {
                light.setDim(wallLightRadius.bright);
                light.setBright(0);
            }
            else {
                light.setDim(wallLightRadius.dim);
                light.setBright(wallLightRadius.bright);
            }
        }

        const isHidden = (() => {
            if (outdoorSceneFlags.outdoorLightStatus === OutdoorLightStatus.off)
                return true;

            if (!emissionWall)
                return false;

            if (emissionWall.door === CONST.WALL_DOOR_TYPES.NONE)
                return false;

            return emissionWall.ds !== CONST.WALL_DOOR_STATES.OPEN;
        })();
        light.setHidden(isHidden);
    }

    if (outdoorSceneFlags.outdoorLightMode === OutdoorLightMode.manualGlobalLight) {
        if (options.luminosity)
            light.setLuminosity(0);

        if (options.maxDarkness) {
            const sceneMaxDarkness = scene.environment.globalLight.darkness.max;
            if (sceneMaxDarkness !== undefined)
                light.setDarknessMax(sceneMaxDarkness);
        }
    }
    else {
        if (options.attenuation && !light.getEmissionWallId())
            light.setAttenuation(0);
    }
}

/**
 * Retrieves the wall document associated with the light when used for wall-based light emission.
 * @param light The AmbientLightProxy to get the emission wall for.
 * @returns The WallDocument if found, null if an id is present but the wall is not found, or undefined if the wall ID is not set.
 */
function getEmissionWall(light: AmbientLightProxy): WallDocument | null | undefined {
    const emissionWallId = light.getEmissionWallId();
    if (!emissionWallId)
        return undefined;

    const scene = light.getScene();
    return scene.getEmbeddedDocument("Wall", emissionWallId, {}) ?? null;
}
/**
 * Calculates the light radius based on the wall configuration.
 * @param wallDoc The wall document representing the wall.
 * @param distancePixels The distance in pixels for scaling.
 * @returns An object containing the dim and bright radius values.
 */
function getLightRadius(
    wallDoc: WallDocument,
    distancePixels: number): { dim: number; bright: number } {

    const outdoorWallFlags = new OutdoorWallFlagsDataModel(wallDoc);

    if (outdoorWallFlags.lightEmission?.units === LightEmissionUnits.feets) {
        return {
            dim: outdoorWallFlags.lightEmission?.dim ?? 0,
            bright: outdoorWallFlags.lightEmission?.bright ?? 0,
        };
    }

    const ray = wallCoordAsRay(wallDoc.c);

    const wallLength = (ray.distance / distancePixels);
    const dimRatio = outdoorWallFlags.lightEmission?.dim ?? outdoorLightSettings.wallLightEmissionDimRadius();
    const brightRatio = outdoorWallFlags.lightEmission?.bright ?? outdoorLightSettings.wallLightEmissionBrightRadius();
    return {
        dim: wallLength * dimRatio,
        bright: wallLength * brightRatio,
    };
}
