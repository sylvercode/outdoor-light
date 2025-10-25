import { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import { MODULE_ID } from "src/ts/constants";
import { OutdoorWallFlagsDataModel } from "src/ts/data/wall_ext";

export const CURTAIN_CLOSE_ICON_PATH = `modules/${MODULE_ID}/icons/svg/curtain-closed.svg`;
export const CURTAIN_OPEN_ICON_PATH = `modules/${MODULE_ID}/icons/svg/curtain-opened.svg`;

export function onInitHandle() {
    foundry.canvas.TextureLoader.loader.loadTexture(CURTAIN_CLOSE_ICON_PATH);
    foundry.canvas.TextureLoader.loader.loadTexture(CURTAIN_OPEN_ICON_PATH);
}

export const LIBWRAPPER_PATCHES: Iterable<LibWrapperWrapperDefinitions> = [
    {
        target: "foundry.canvas.containers.DoorControl.prototype._getTexture",
        fn: getTexture_Wrapper,
        type: "MIXED"
    }
];

function getTexture_Wrapper(this: DoorControl, wrapped: LibWrapperBaseCallback, ...args: LibWrapperBaseCallbackArgs): any {
    const texture = getWidowsTexture(this);
    if (texture !== null)
        return texture;
    const result = wrapped.apply(this, args);
    return result;
}

function getWidowsTexture(dc: DoorControl): loadTexture.Return | null {
    const wallDoc = dc.wall.document;
    const wallFlags = new OutdoorWallFlagsDataModel(wallDoc);
    if (!wallFlags.isCurtain)
        return null;

    if (wallDoc.door === CONST.WALL_DOOR_TYPES.NONE)
        return null;

    if (wallDoc.light !== CONST.WALL_SENSE_TYPES.NONE &&
        wallDoc.light !== CONST.WALL_SENSE_TYPES.PROXIMITY)
        return null;

    const texturePath = (() => {
        if (wallDoc.ds === CONST.WALL_DOOR_STATES.OPEN)
            return CURTAIN_OPEN_ICON_PATH;
        return CURTAIN_CLOSE_ICON_PATH;
    })();

    return foundry.canvas.getTexture(texturePath);
}
