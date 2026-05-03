import React, {useContext, useState} from 'react'
import withAuth  from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import '../App.css'
import { IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button';
import { AuthContext } from '../contexts/AuthContext';


function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async() =>{
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }
  return (
    <>
        <div className="navBar">
            <div style={{display:"flex", alignItems:"center"}}>
                <h2>Apna Video Call</h2>
            </div>
            <div style={{display:"flex", alignItems:"center"}}>
                <IconButton onClick={() =>{
                    navigate("/history")
                }}>
                    <RestoreIcon />
                    
                </IconButton>
                <p style={{marginRight:"10px"}}>History</p>
                <div onClick={() =>{
                    localStorage.removeItem("token")
                    navigate("/auth")
                }} style={{cursor:"pointer"}}>
                    Logout
                </div>
            </div>

        </div>
        <div className="meetContainer">
            <div className="leftPanel">
                <div>
                    <h2>Providing Quality Video call Just Like Quality Education</h2>
                    <div style={{display:"flex", gap:"10px"}}>
                    <TextField id="outlined-basic" onChange={e=>setMeetingCode(e.target.value)} label="Meeting Code" variant="outlined" />
                    <Button variant="contained" onClick={handleJoinVideoCall}>Join</Button>
                    </div>
                </div>
                
            </div>
            <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
            </div>
        </div>
    </>
  )
}

export default withAuth(HomeComponent);
