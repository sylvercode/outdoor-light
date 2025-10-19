/**
 * A custom field for string field with choices based on an enum.
 * @param T The type of the enum values.
 * @param TEnum The enum type. (should be typeof T)
 */
export class EnumField<T, TEnum>
    extends foundry.data.fields.StringField<EnumFieldOptions<T, TEnum>> {
    constructor(options: EnumFieldOptions<T, TEnum>) {
        super(options);
    }
}

/**
 * Field options for EnumField.
 * @param T The type of the enum values.
 * @param TEnum The enum type. (should be typeof T)
 */
export type EnumFieldOptions<T, TEnum> =
    foundry.data.fields.StringField.Options<T> & { choices: Record<keyof TEnum, string> };
