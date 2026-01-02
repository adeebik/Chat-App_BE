import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8000 });
let allSocket = [];

wss.on("connection", (socket) => {
  allSocket.push(socket);

  console.log("User Connected #");

  socket.on("message", (msg) => {
    console.log("msg received :" + msg.toString());
    allSocket.forEach((e) => e.send(msg.toString() + " : sent from server"));
  });

  socket.on("disconnect", () => {
    allSocket.filter((x) => x != socket);
  });
});
