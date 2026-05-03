import { Routes, Route } from "react-router-dom";
import LandingPage from './pages/landing'
import Authentication from './pages/authentication'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";

function App() {

  return (
    <>
        <AuthProvider>
            <Routes>
              <Route path='/' element={<LandingPage />} />
              <Route path='/auth' element={<Authentication />} />
              <Route path='/home' element={<HomeComponent />} />
              <Route path='/:url' element={<VideoMeetComponent />} />
              <Route path="/history" element={<History />} />
            </Routes>
        </AuthProvider>
    </>
  )
}

export default App
