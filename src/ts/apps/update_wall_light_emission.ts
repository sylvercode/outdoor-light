import { LightEmissionSide, LightEmissionUnits, OutdoorWallFlagsDataModel } from "../data/wall_ext";
import { outdoorLightSettings } from "../settings";

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

    const ray = getWallRay(wall);
    const center = getRayCenter(ray);
    const lightRadius = getLightRadius(ray, outdoorWallFlags, wall.parent.dimensions.distancePixels);
    const rotationDegrees = getRotationDegrees(lightSide === LightEmissionSide.left, ray);

    const lightData: AmbientLightDocument.UpdateData = {
        x: center.x,
        y: center.y,
        config: {
            angle: 180,
            dim: lightRadius.dim,
            bright: lightRadius.bright,
        },

        rotation: rotationDegrees,
        flags: {
            "outdoor-light": {
                emissionWallId: wall.id,
            },
        },
    };

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
 * Creates a Ray object representing the wall's position.
 * @param wall The wall document.
 * @returns A Ray object representing the wall.
 */
function getWallRay(wall: WallDocument): foundry.canvas.geometry.Ray {
    return new foundry.canvas.geometry.Ray({ x: wall.c[0], y: wall.c[1] }, { x: wall.c[2], y: wall.c[3] });
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
 * Calculates the light radius based on the wall's ray and outdoor wall flags.
 * @param ray The ray representing the wall.
 * @param outdoorWallFlags The outdoor wall flags data model.
 * @param distancePixels The distance in pixels for scaling.
 * @returns An object containing the dim and bright radius values.
 */
function getLightRadius(ray: Ray, outdoorWallFlags: OutdoorWallFlagsDataModel, distancePixels: number): { dim: number; bright: number } {
    if (outdoorWallFlags.lightEmission?.units === LightEmissionUnits.feets) {
        return {
            dim: outdoorWallFlags.lightEmission?.dim ?? 0,
            bright: outdoorWallFlags.lightEmission?.bright ?? 0,
        };
    }

    const wallLength = (ray.distance / distancePixels);
    const dimRatio = outdoorWallFlags.lightEmission?.dim ?? outdoorLightSettings.wallLightEmissionDimRadius();
    const brightRatio = outdoorWallFlags.lightEmission?.bright ?? outdoorLightSettings.wallLightEmissionBrightRadius();
    return {
        dim: wallLength * dimRatio,
        bright: wallLength * brightRatio,
    };
}
