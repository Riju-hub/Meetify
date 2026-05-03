import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const router = useNavigate();
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className='navHeader'>
          <h2>Apna Video Call</h2>
        </div>
        <div className='navlist'>
          <p onClick={()=>router('/dfgh')}>Join as Guest</p>
          <p onClick={()=>router('/auth')}>Register</p>
          <div role='button' onClick={() => router('/auth')}>
            Login
          </div>
        </div>
      </nav>
      <div className='landingMainContent'>
        <div>
          <h1><span style={{color:"#ff9839"}}>Connnect</span> with your Loved Ones</h1>
          <p>Cover a distance by apna video call </p>
          <div role='button'>
            <Link to="/auth">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  )
}
