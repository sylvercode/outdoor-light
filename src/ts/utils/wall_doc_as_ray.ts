/**
 * Convert a WallDocument's coordinate array into a Ray object.
 */
export default function wallCoordAsRay(coord: WallDocument["c"]): Ray {
    return new foundry.canvas.geometry.Ray({ x: coord[0], y: coord[1] }, { x: coord[2], y: coord[3] });
}
