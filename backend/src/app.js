import dns from 'dns';
import {connectToSocket} from "./controllers/socketManager.js";
// Force Node to use Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from 'express';
import {createServer} from "node:http";

import {Server} from "socket.io";

import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/usersRoutes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port",(process.env.PORT || 5000));
app.use(cors());
app.use(express.json({limit: '40kb'}));
app.use(express.urlencoded({limit: '40kb', extended: true}));
app.use("/api/v1/users",userRoutes);

const start = async()=>{
    const connnectionDb = await mongoose.connect("mongodb+srv://bhabasindhudas621_db_user:ZU1cDYft3b72lk5p@videocall.rjipezs.mongodb.net/?appName=VideoCall")
    console.log(`mongoDB connected to host port : ${connnectionDb.connection.host}`);
    
    server.listen(app.get("port"),()=>{
        console.log("LISTENING ON PORT 5000")
    });
};
start();