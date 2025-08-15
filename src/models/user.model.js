import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
email: {
    type: String,
    required: true,
    unique: true,
},
password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, 
},
firstName: {
    type: String,
    required: true,
},
lastName: {
    type: String,
    required: true,
},
handle: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
},
profilePicture: {
    type: String,
    default: "https://static.vecteezy.com/system/resources/previews/024/983/914/large_2x/simple-user-default-icon-free-png.png"
}
},{timestamps: true});

const User = mongoose.model("User", userSchema);
export default User;