import { DataField, DataSchema } from "fvtt-types/src/foundry/common/data/fields.mjs";

/**
 * Class for building form groups for data fields.
 */
export default class FieldBuilder<T extends DataSchema> {
    /**
     * Creates an instance of FieldBuilder.
     * @param rootId The root ID for the form groups.
     * @param schema The data schema for the fields.
     * @param data The initial data for the fields.
     */
    constructor(
        private rootId: string,
        private schema: T,
        private data: { [key in keyof T]: any }
    ) { }

    /**
     * Gets the form group for a specific field.
     * @param fieldName The name of the field.
     * @param inputConfigOverride Optional input configuration overrides.
     * @returns The HTMLDivElement representing the form group.
     */
    get<TFieldName extends keyof T>(fieldName: TFieldName, inputConfig?: DataField.ToInputConfig<DataField.InitializedTypeFor<T[TFieldName]>>) {
        const field = this.schema[fieldName];
        inputConfig ??= foundry.utils.mergeObject({ value: this.data[fieldName] }, inputConfig);
        return field.toFormGroup(
            { rootId: this.rootId },
            inputConfig
        );
    }
}
