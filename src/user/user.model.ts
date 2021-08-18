import mongoose from 'mongoose';

import User from './user.interface';

const addressSchema = new mongoose.Schema({
  city: String,
  country: String,
  street: String,
});

const userSchema = new mongoose.Schema(
  {
    address: addressSchema,
    email: String,
    firstName: String,
    lastName: String,
    password: {
      type: String,
      get: (): undefined => undefined,
    },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  }
);

userSchema.virtual('fullName').get((firstName: string, lastName: string) => {
  return `${firstName} ${lastName}`;
});

userSchema.virtual('posts', {
  ref: 'Post', // Modelo a copiar
  localField: '_id', // llave primaria
  foreignField: 'author', // llave secundaria
});

const userModel = mongoose.model<User & mongoose.Document>('User', userSchema);

export default userModel;
