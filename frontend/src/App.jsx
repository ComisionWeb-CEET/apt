import { useState, useEffect } from 'react'
import { useAuth } from './config/Auth'
import { io } from 'socket.io-client';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from './views/Login'
import Estrado from "./pages/Estrado";
import Admin from './views/Admin'
import Public from './views/Public'
import Countdown from './views/Countdown'
import './index.css'

const url = import.meta.env.DEV ? "http://localhost:8080" : '/';
const socket = io(url);

export default function App() {

  const { account, setAccount } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const asambleaDate = new Date("Sep 12, 2026 09:00:00").getTime();

  useEffect(() => {
    const savedToken = localStorage.getItem('ceettoken');

    socket.on('resVerificacion', (datos) => {
      if (datos){
        setAccount(datos);
      } else {
        localStorage.removeItem("ceettoken");
        setAccount(null);
      }

      setCargando(false);
    });

    if (savedToken){
      socket.emit('verificacion', savedToken)
    } else {
      setAccount(null);
      setCargando(false);
    }
    
    return () => socket.off('resVerificacion')
  }, [setAccount]);

  // useEffect(() => {

  //   if (asambleaDate - new Date().getTime() <= 0) {
  //     setIsExpired(true);
  //     return;
  //   }

  //   const timer = setInterval(() => {
  //     if (asambleaDate - new Date().getTime() <= 0) {
  //       setIsExpired(true);
  //       clearInterval(timer);
  //     }
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [asambleaDate]);

  if (cargando) {
    return (
      <div className="flex justify-center items-center w-screen h-screen">
      <div className="relative flex justify-center items-center w-24 h-24">
        <svg className="absolute w-full h-full" fill="#0088ff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
            <animateTransform attributeName="transform" type="rotate" dur="2s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
          </path>
        </svg>

        {/* <img src="/ceetina.png" className="animate-spin w-16 h-16 object-contain z-10"/> */}
      </div>
        
      </div>
    )
    
  }

  // if (!isExpired) {
  //   return  (
  //     <div>
  //       <h1 className="bg-red-500 text-white text-3xl p-5">TEST TAILWIND</h1>
  //       <button className="btn btn-primary m-5">Prueba DaisyUI</button>
  //       <Countdown targetDate={asambleaDate}/>
  //     </div>
  //   )
  // }
    return (
      <Routes>
          <Route path="/estrado" element={<Estrado />} />

          <Route
            path="/"
            element={
              account === null ? (
                <Login />
              ) : account.admin === 1 || account.admin === true ? (
                <Admin />
              ) : (
                <Public />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }