import { MODULE_ID } from "../constants";
import { OutdoorLightFlagName } from "../data/ambient_light_ext";
import { OutdoorWallFlagsDataModel } from "../data/wall_ext";
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
    const lightEnabled = outdoorWallFlags.lightEmission?.enabled ?? false;


    const light = (() => {
        const lightId = outdoorWallFlags.lightEmission?.lightId ?? null;
        if (!lightId)
            return null;
        return game.canvas?.scene?.getEmbeddedDocument("AmbientLight", lightId, {});
    })();

    if (!lightEnabled) {
        if (light)
            await light.delete();
        return null;
    }

    const ray = wallCoordAsRay(wall.c);
    const center = getRayCenter(ray);

    const lightData: AmbientLightUpdateDataWithEmissionWallId = {
        x: center.x,
        y: center.y,
        config: {
            angle: 360
        },

        rotation: 0,
        flags: {
            [MODULE_ID]: {
                emissionWallId: wall.id,
                isOutdoor: outdoorWallFlags.isBlockingOutdoorLight,
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
 * Calculates the center point of a ray.
 * @param ray The ray to calculate the center point for.
 * @returns The center point of the ray.
 */
function getRayCenter(ray: foundry.canvas.geometry.Ray): Canvas.Point {
    const midX = (ray.A.x + ray.B.x) / 2;
    const midY = (ray.A.y + ray.B.y) / 2;

    return { x: midX, y: midY };
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
