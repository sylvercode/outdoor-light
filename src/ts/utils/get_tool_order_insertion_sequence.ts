import SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";

/**
 * Type definition for a sequence generator function.
 * The function returns a new number each time it is called.
 */
type SequenceGenerator = () => number;

/**
 * Returns a sequence generator function that provides the next indexes to insert new tools at the end of the existing tools,
 * but before the specified tail tools.
 * @param tools The existing tools in the scene controls.
 * @param tailToolNames The names of the tools that should remain at the end of the list.
 * @returns A sequence generator function.
 */
export default function getToolOrderInsertionSequence(tools: Record<string, SceneControls.Tool>, tailToolNames: string[] = []): SequenceGenerator {
    let lastIndex = -1;
    let tailToolIndex = -1;
    for (const toolKey of Object.keys(tools)) {
        const order = tools[toolKey].order;

        if (order > lastIndex)
            lastIndex = order;

        if (!tailToolNames.includes(toolKey))
            continue;

        if (tailToolIndex === -1 || order < tailToolIndex)
            tailToolIndex = order;
    }

    // Check if tail tools have been removed by other modules.
    if (tailToolIndex === -1 || tailToolIndex === 0)
        return createSequenceGenerator({ nextIndex: Math.max((lastIndex + 1), 0), step: 1 });

    // Get the index just before the tail tools.
    lastIndex = -1;
    for (const toolKey of Object.keys(tools)) {
        const order = tools[toolKey].order;
        if (order > lastIndex && order < tailToolIndex)
            lastIndex = order;
    }

    // Make step size 1/10th of the distance to the tail tools to allow for future insertions.
    const step = (tailToolIndex - lastIndex) / 10;
    return createSequenceGenerator({ nextIndex: Math.max((lastIndex + step), 0), step });
}

/**
 * Creates a sequence generator function based on the provided insertion information.
 * @param insertionInfo An object containing the next index to start from and the step size.
 * @param insertionInfo.nextIndex The next index to start from.
 * @param insertionInfo.step The step size to increment the index by.
 * @returns A sequence generator function.
 */
function createSequenceGenerator(insertionInfo: { nextIndex: number, step: number }): SequenceGenerator {
    let currentIndex = insertionInfo.nextIndex;
    const step = insertionInfo.step;

    return () => {
        const index = currentIndex;
        currentIndex += step;
        return index;
    };
}
