import { MODULE_ID } from "../constants";
import { OutdoorLightFlagName } from "../data/ambient_light_ext";
import { LightEmissionSide, OutdoorWallFlagsDataModel } from "../data/wall_ext";
import { AmbientLightProxy } from "../proxies/ambient_light_proxy";
import wallCoordAsRay from "../utils/wall_doc_as_ray";
import applyDefaultOutdoorLightSettings from "./apply_default_outdoor_light_settings";

/**
 * Updates or creates the light emission ambient light for a wall based on its outdoor wall flags.
 * @param wall The wall document to update the light emission for.
 * @returns The ID of the updated or created ambient light, or null if no light is needed.
 */
export default async function updateWallLightEmission(wall: WallDocument): Promise<string | null> {
    if (!wall.id || !wall.parent)
        throw new Error("Wall must have an ID and a parent to update light emission.");

    const outdoorWallFlags = new OutdoorWallFlagsDataModel(wall);
    const lightSide = outdoorWallFlags.lightEmission?.side ?? LightEmissionSide.none;


    const light = (() => {
        const lightId = outdoorWallFlags.lightEmission?.lightId ?? null;
        if (!lightId)
            return null;
        return game.canvas?.scene?.getEmbeddedDocument("AmbientLight", lightId, {});
    })();

    if (lightSide === LightEmissionSide.none) {
        if (light)
            await light.delete();
        return null;
    }

    const ray = wallCoordAsRay(wall.c);
    const center = getRayCenter(ray);
    const rotationDegrees = getRotationDegrees(lightSide === LightEmissionSide.left, ray);

    const lightData: AmbientLightUpdateDataWithEmissionWallId = {
        x: center.x,
        y: center.y,
        config: {
            angle: 180
        },

        rotation: rotationDegrees,
        flags: {
            [MODULE_ID]: {
                emissionWallId: wall.id,
            },
        },
    };

    const updateDataProxy = new AmbientLightUpdateData(lightData, wall.parent);
    applyDefaultOutdoorLightSettings(updateDataProxy);

    if (light) {
        await light.update(lightData);
        return light.id;
    }

    const newLights = await wall.parent.createEmbeddedDocuments("AmbientLight", [lightData]);
    return newLights?.[0]?.id ?? null;
}

/**
 * Calculates the rotation in degrees for the light based on the wall's ray and which side the light is on.
 * @param isLeft Whether the light is on the left side of the wall.
 * @param ray The ray representing the wall.
 * @returns The rotation in degrees for the light.
 */
function getRotationDegrees(isLeft: boolean, ray: Ray): number {
    const rotationDegrees360 = ((ray.angle * 180) / Math.PI + 360) % 360;
    if (isLeft)
        return rotationDegrees360;

    return (rotationDegrees360 > 180) ? rotationDegrees360 - 180 : rotationDegrees360 + 180;
}

/**
 * Calculates the center point of a ray.
 * @param ray The ray to calculate the center point for.
 * @returns The center point of the ray.
 */
function getRayCenter(ray: foundry.canvas.geometry.Ray): Canvas.Point {
    const x = (ray.A.x + ray.B.x) / 2;
    const y = (ray.A.y + ray.B.y) / 2;
    return { x, y };
}

/**
 * Type alias for AmbientLightDocument update data with emission wall ID flag defined.
 */
type AmbientLightUpdateDataWithEmissionWallId = AmbientLightDocument.UpdateData & { flags: { [MODULE_ID]: { [OutdoorLightFlagName.emissionWallId]: string } } };

class AmbientLightUpdateData implements AmbientLightProxy {
    constructor(private data: AmbientLightUpdateDataWithEmissionWallId,
        private Scene: Scene
    ) { }

    getScene(): Scene {
        return this.Scene;
    }
    getBright(): number {
        return this.data.config?.bright ?? 0;
    }
    setBright(bright: number): void {
        const config = this.data.config ??= {};
        config.bright = bright;
    }
    getDim(): number {
        return this.data.config?.dim ?? 0;
    }
    setDim(dim: number): void {
        const config = this.data.config ??= {};
        config.dim = dim;
    }
    setHidden(hidden: boolean): void {
        this.data.hidden = hidden;
    }
    setLuminosity(luminosity: number): void {
        const config = this.data.config ??= {};
        config.luminosity = luminosity;
    }
    setDarknessMax(max: number): void {
        const config = this.data.config ??= {};
        config.darkness = config.darkness ?? {};
        config.darkness.max = max;
    }
    setAttenuation(attenuation: number): void {
        const config = this.data.config ??= {};
        config.attenuation = attenuation;
    }

    getEmissionWallId(): string | null {
        return this.data.flags[MODULE_ID].emissionWallId;
    }
}
