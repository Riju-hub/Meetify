import React, { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import io from "socket.io-client";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import { redirect, useNavigate } from 'react-router-dom';

import "../styles/videoComponent.css";
import Badge from '@mui/material/Badge';
const serverURL = "http://localhost:5000"
const connections = {}

const peerConfigConnections = {
    "iceServers" : [
        {"urls" : "stun:stun.l.google.com:19302"}
    ]
}


export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState();
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();
    const [showModel, setShowModel] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState();
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const videoRef = useRef([]);

    const [videos, setVideos] = useState([]);

    const getPermissions = async () => {
        try {

            const videoPermission = await navigator.mediaDevices.getUserMedia({video:true})
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio:true})
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }else{
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable})
                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getPermissions();
    }, [])

    const getUserMediaSuccess = (stream) =>{
        // todo
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections){
            if(id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer()
            .then((description)=>{
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch(e=>console.log(e));
            })
            .catch(e=>console.log(e));
            
        }
        stream.getTracks().forEach(track => track.onended = () =>{
            setAudio(false);
            setVideo(false);
            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track=>track.stop())
            } catch (e) {
                console.log(e);
            }
            // TODO BlackSilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connections){
                connections[id].addStream(window.localStream);
                connections[id].createOffer()
                .then((description)=>{
                    connections[id].setLocalDescription(description)
                    .then(()=>{
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                    })
                    .catch(e=>console.log(e));
                })
                .catch(e=>console.log(e));
            }
        })

    }

    let silence = () =>{
        let ctx = AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
    }

    let black = ({width = 640, height = 480} = {}) =>{
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext("2d").fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});
    }

    const getUserMedia = () =>{
        if((audio && audioAvailable) || (video && videoAvailable)){
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess) // TODO : getMediaUserSuccess
            .then((Stream)=>{})
            .catch((err)=>{console.log(err);
            })
        }else{
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());

            } catch (e) {
                console.log(e);
            }
        }
    }

    useEffect(()=>{
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    },[audio, video])

    // TODO
    const gotMessageFromServer = (fromId, message) =>{
        let signal = JSON.parse(message);
        // Add this safety check:
        if (!connections[fromId]) return;
        if(fromId !== socketIdRef.current){
            if(signal.sdp){
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(()=>{
                    if(signal.sdp.type === "offer"){
                        connections[fromId].createAnswer()
                        .then((description)=>{
                            connections[fromId].setLocalDescription(description)
                            .then(()=>{
                                socketRef.current.emit("signal", fromId, JSON.stringify({"sdp": connections[fromId].localDescription}))
                            })
                            .catch(e=>console.log(e));
                        })
                        .catch(e=>console.log(e));
                    }
                })
                .catch(e=>console.log(e));
            }
        }
        if(signal.ice){
            if(connections[fromId] && connections[fromId].remoteDescription){
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch(e=>console.log(e));
            }
        }
    }

    // TODO addMessages
    const addMessage = (data, sender, socketIdSender) =>{
        setMessages((prevMessages)=>[
            ...prevMessages,
            {sender:sender,data:data}
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages(prevMessages=>prevMessages + 1);
        }
    }

    const connectToSocketServer = () =>{
        socketRef.current = io.connect(serverURL,{secure:false})
        socketRef.current.on("signal",gotMessageFromServer)
        socketRef.current.on("connect",()=>{
            socketRef.current.emit("join-call",window.location.href)
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on("chat-message",addMessage)
            socketRef.current.on("user-left",(id)=>{
                setVideos((prevVideos)=>{prevVideos.filter(video => video.socketId !== id)});
                // Close and delete the specific peer connection
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            })
            socketRef.current.on("user-joined",(id,clients)=>{
                clients.forEach((socketListId)=>{
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event)=>{
                        if(event.candidate != null){
                            socketRef.current.emit("signal",socketListId,JSON.stringify({"ice": event.candidate}))
                        }
                    }

                    connections[socketListId].onaddstream = (event)=>{
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(prevVideos =>{
                                const updatedVideos = prevVideos.map(video => 
                                    video.socketId === socketListId ? {...video, stream: event.stream} : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }else{
                            const newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }
                            setVideos(videos =>{
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };
                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream);
                    }else{
                        // todo BlackSilence
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }

                })
                if (id === socketIdRef.current) {
                    for(let id2 in connections){
                        if(id2 === socketIdRef.current) continue;
                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (e) {
                            console.log(e);
                            
                        }
                        connections[id2].createOffer().then((description)=>{
                            connections[id2].setLocalDescription(description)
                            .then(()=>{
                                socketRef.current.emit("signal", id2, JSON.stringify({"sdp":connections[id2].localDescription}))
                            })
                            .catch(e=>console.log(e));
                            
                        })
                    }
                }
            })
        })
    }

    const getMedia = ()=>{
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        // setScreen(screenAvailable);
        connectToSocketServer();
    }

    let routeTo = useNavigate();

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () =>{
        setVideo(!video);
    }

    let handleAudio = () =>{
        setAudio(!audio);
    }

    let getDisplayMediaSuccess = (stream) =>{
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connections){
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer()
            .then((description)=>[
                connections[id].setLocalDescription(description)
                .then(()=>{
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp": connections[id].localDescription}))
                })
                .catch(e=>console.log(e))
            ])
            .catch(e=>console.log(e))
        }
        stream.getTracks().forEach(track => track.onended = () =>{
            setScreen(false)
            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track=>track.stop())
            } catch (e) {
                console.log(e);
            }
            // TODO BlackSilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }



    let getDisplayMedia = () =>{
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
                .then(getDisplayMediaSuccess)
                .then((stream)=>{})
                .catch(e=>console.log(e));
            }
        }
    }

    useEffect(()=>{
        if (screen!== undefined) {
            getDisplayMedia();
        }
    },[screen])

    let handleScreen = () =>{
        setScreen(!screen);
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", username, message);
        setMessage("");
    }

    // let handleEndCall = () =>{
    //     try {
    //         let tracks = localVideoRef.current.srcObject.getTracks()
    //             tracks.forEach(track=>track.stop())
    //     } catch (e) {console.log(e);}
    //     routeTo("/:url");
    // }

    useEffect(() => {
        // This runs when the component is destroyed
        return () => {
            handleEndCall();
        };
    }, []);

    let handleEndCall = () => {
        // 1. Stop all local tracks (Camera and Mic)
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null; // Clear the reference
            }
            // Also clear the video element's source
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
        } catch (e) {
            console.log("Error stopping tracks:", e);
        }

        // 2. Disconnect from the socket server
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // 3. Clear all Peer Connections
        for (let id in connections) {
            connections[id].close();
            delete connections[id];
        }

        // 4. Reset states
        setVideos([]);
        
        // 5. Navigate back to home/landing
        routeTo("/home"); // Change this to your desired landing path
    };

  return (
    <div>

        {askForUsername === true ? 
            <div>
               <h2> Enter into Lobby</h2>
                <TextField required id="outlined-basic" label="Username" value={username} onChange={e=> setUsername(e.target.value)} variant="outlined" />
                <Button variant="contained" onClick={connect}>Connect</Button>

                <div>
                    <video ref={localVideoRef} autoPlay muted ></video>
                </div>

            </div>:
            <div className='meetVideoContainer'>

                {showModel ? <div className="chatRoom">
                    <div className="chatContainer">
                        <h2>Chat</h2>
                        <div className="chattingDisplay">
                            {messages.map((item, index)=>{
                                return(

                                    <div style={{marginBottom:"20px"}} key={index}>
                                        <p style={{fontWeight:"bold"}}>{item.sender}</p>
                                        <p>{item.data}</p>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="chattingArea">
                            <TextField id="outlined-basic" value={message} onChange={e=>setMessage(e.target.value)} label="Enter your chat" variant="outlined" />
                            <Button variant="contained" onClick={sendMessage} endIcon={<SendIcon />}>Send</Button>
                        </div>

                    </div>
                    
                </div> : <></>}
                 

                <div className="buttonContainers">
                    <IconButton onClick={handleVideo} style={{color:"white"}}>
                        {(video===true) ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>
                    <IconButton onClick={handleEndCall} style={{color:"red"}}>
                        <CallEndIcon/>
                    </IconButton>
                    <IconButton onClick={handleAudio} style={{color:"white"}}>
                        {audio===true ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>

                    {screenAvailable===true ?
                    <IconButton onClick={handleScreen} style={{color:"white"}}>
                        {screen === true ? <ScreenShareIcon/>:<StopScreenShareIcon/>}
                    </IconButton>:<></>
                    }

                    <Badge badgeContent={newMessages} max={999} color='secondary'>
                        <IconButton onClick={()=> setShowModel(!showModel)} style={{color:"white"}}>
                            <ChatIcon/>
                        </IconButton>
                    </Badge>

                </div>

                <video className='meetUserVideo' ref={localVideoRef} autoPlay muted ></video>
                <div className='conferenceView'>
                    {Array.isArray(videos) && videos.map((video)=>(
                        <div key={video.socketId}>
                            <video 
                            data-socket={video.socketId}
                            ref={ref =>{
                                if(ref && video.stream){
                                    ref.srcObject = video.stream;
                                }
                            }}
                            autoPlay
                            ></video>

                        </div>
                    ))}
                </div>
            </div>
        }

    </div>
  )
}
