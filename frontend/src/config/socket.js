import { io } from "socket.io-client";

const url = import.meta.env.DEV ? "http://localhost:8080" : "http://20.111.41.211:8080";

export const socket = io(url, {
  transports: ["websocket"] 
});