const mongoose = require("mongoose");
require("dotenv").config();
const { UserModel } = require("./models/users.models");

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await UserModel.find();
    console.log("Danh sách user thực tế trong DB:", users);
    process.exit();
}
check();