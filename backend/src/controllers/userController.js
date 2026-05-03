import httpStatus from 'http-status'
import { User } from "../models/userModel.js";
import bcrypt, {hash} from 'bcrypt';
import crypto from 'crypto';
import { Meeting } from '../models/meetingModel.js';

export const login = async(req,res)=>{
    const {username,password} = req.body;
    if(!username || !password){
        return res.status(400).json({message:"please provide username and password"})
    }
    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message:"User not found"})
        }
        if(await bcrypt.compare(password, user.password)){
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token:token})
            
        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid credentials"})
        }
    }
    catch(e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something went wrong ${e.message}`})
    }
}

export const register = async(req,res)=>{
    const {name,username,password} = req.body;
    try{
        const existingUser = await User.findOne({username});
        if (existingUser){
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }
        const hasedPassword = await bcrypt.hash(password,10);

        const newUser = new User({
            name:name,
            username:username,
            password:hasedPassword,

        });
        await newUser.save();
        res.status(httpStatus.CREATED).json({message:"User Registered"})
    } catch(e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something went wrong ${e.message}`})
    }
};

export const getUserHistory = async(req,res)=>{
    const {token} = req.query;
    try {
        const user = await User.findOne({token:token});
        const meetings = await Meeting.find({user_id:user.username});
        res.json(meetings);

    } catch (e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something went wrong ${e.message}`})
    }
}

export const addToHistory = async(req,res)=>{
    const {token,meetingCode} = req.body;
    try {
        const user = await User.findOne({token:token});
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found. Please login again." });
        }
        const newMeeting = new Meeting({
            user_id : user.username,
            meetingCode : meetingCode,
        });
        await newMeeting.save();

        res.status(httpStatus.CREATED).json({message:"Meeting added to history"})
    }catch (e) {
        console.error("addToHistory error:", e); // Add this to see exact error
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:`Something went wrong ${e.message}`})
    }
}