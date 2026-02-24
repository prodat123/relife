// socket.js
import { io } from "socket.io-client";
import config from "./config";

// Point this to your backend (adjust port if needed)
const socket = io(config.backendUrl, {
  transports: ["polling", "websocket"], // ensures lowest-latency connection
  withCredentials: true,
});

export default socket;
