import { registerDecorator } from 'class-validator';
export function IsNonPrimitiveArray(validationOptions) {
    return (object, propertyName) => {
        registerDecorator({
            name: 'IsNonPrimitiveArray',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    return Array.isArray(value) && value.reduce((a, b) => a && typeof b === 'object' && !Array.isArray(b), true);
                },
            },
        });
    };
}
//# sourceMappingURL=validationNonPrimitiveArray.js.map