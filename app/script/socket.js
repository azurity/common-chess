import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const socket = io(`ws://${window.location.host}/`, {
    transports: ["websocket"],
});
socket.emit("uuid", localStorage.getItem("user-uuid"));

socket.on("uuid", () => {
    socket.emit("uuid", localStorage.getItem("user-uuid"));
});

export default socket;
