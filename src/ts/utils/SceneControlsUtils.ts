import SceneControls from "fvtt-types/src/foundry/client/applications/ui/scene-controls.mjs";

type InsertionInfo = { nextIndex: number, step: number };

type SequenceGenerator = () => number;

export function getToolOrderInsertionSequence(tools: Record<string, SceneControls.Tool>, tailToolNames: string[] = []): SequenceGenerator {
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

function createSequenceGenerator(insertionInfo: InsertionInfo): SequenceGenerator {
    let currentIndex = insertionInfo.nextIndex;
    const step = insertionInfo.step;

    return () => {
        const index = currentIndex;
        currentIndex += step;
        return index;
    };
}
