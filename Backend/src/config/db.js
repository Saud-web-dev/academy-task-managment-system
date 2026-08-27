import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        // await mongoose.connect("mongodb://127.0.0.1:27017/test");
        console.log("MongoDB Connected ✅");
    } catch (error) {
        console.log("MongoDB Error ❌", error.message);
        process.exit(1);
    }
};
export default connectDB;


