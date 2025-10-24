import { LibWrapperBaseCallback, LibWrapperBaseCallbackArgs, LibWrapperWrapperDefinitions } from "fvtt-lib-wrapper-types";
import { MODULE_ID } from "src/ts/constants";

const CURTAIN_CLOSE_ICON_PATH = `modules/${MODULE_ID}/icons/svg/curtain-closed.svg`;
const CURTAIN_OPEN_ICON_PATH = `modules/${MODULE_ID}/icons/svg/curtain-opened.svg`;

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
    const doorDoc = dc.wall.document;
    if (doorDoc.door === CONST.WALL_DOOR_TYPES.NONE)
        return null;

    if (doorDoc.light !== CONST.WALL_SENSE_TYPES.NONE &&
        doorDoc.light !== CONST.WALL_SENSE_TYPES.PROXIMITY)
        return null;

    const texturePath = (() => {
        if (doorDoc.ds === CONST.WALL_DOOR_STATES.OPEN)
            return CURTAIN_OPEN_ICON_PATH;
        return CURTAIN_CLOSE_ICON_PATH;
    })();

    return foundry.canvas.getTexture(texturePath);
}
