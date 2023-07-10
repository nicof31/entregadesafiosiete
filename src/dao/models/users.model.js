import mongoose from "mongoose";

const userCollection = "users"

const userSchema = new mongoose.Schema({
  first_name: { type: String, require: true, minLength: 3, maxLength: 60 },
  last_name: { type: String, require: true, minLength: 3, maxLength: 60 },
  email: { type: String, require: true, unique: true, index: true },
  age: { type: Number, require: true, min: 18, max: 100 },
  password: { type: String, require: true },
  profile_type: { type: String, required: true, enum: ["admin", "user"] },
  });
  
  const UserModel = mongoose.model(userCollection, userSchema);

  export default UserModel