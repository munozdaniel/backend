import mongoose from 'mongoose';
const addressSchema = new mongoose.Schema({
    city: String,
    country: String,
    street: String,
});
const userSchema = new mongoose.Schema({
    address: addressSchema,
    email: String,
    firstName: String,
    lastName: String,
    password: {
        type: String,
        get: () => undefined,
    },
}, {
    toJSON: {
        virtuals: true,
        getters: true,
    },
});
userSchema.virtual('fullName').get((firstName, lastName) => {
    console.log('firstName', firstName);
    return `${firstName} ${lastName}`;
});
userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author',
});
const userModel = mongoose.model('User', userSchema);
export default userModel;
//# sourceMappingURL=user.model.js.map