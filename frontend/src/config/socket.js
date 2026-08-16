import { io } from "socket.io-client";

// Usamos la variable para detectar si estamos en local o en producción
const url = import.meta.env.DEV ? "http://localhost:8080" : "https://pideturno.ceet.org.es";

export const socket = io(url, {
  transports: ["polling"]
});