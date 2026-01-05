import { WebSocket, WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map<string, Set<WebSocket>>();

type userInfo = {
  room: string;
  name: string;
};

const users = new Map<WebSocket, userInfo>();

wss.on("connection", (webSocket) => {
  console.log("New client connected");

  webSocket.on("error", (e) => {
    console.log("Error occurred :", e);
  });

  webSocket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "join") {
        const { roomId, name } = msg.payload;

        if (!roomId || !name) {
          return webSocket.send(
            JSON.stringify({
              type: "error",
              text: "Invalid room ID or name",
            })
          );
        }

        if (!rooms.has(roomId)) {
          const data = JSON.stringify({
            type: "error",
            text: "Room does not exist, Please Create.",
          });
          return webSocket.send(data);
        }

        rooms.get(roomId)?.add(webSocket);
        users.set(webSocket, { room: roomId, name });

        const Joindata = JSON.stringify({
          type: "system",
          text: `${name} joined the room`,
        });

        rooms.get(roomId)?.forEach((socket) => {
          socket.send(Joindata);
        });

        webSocket.send(
          JSON.stringify({
            type: "joined",
            payload: { roomId, name },
          })
        );

        return;
      }

      if (msg.type === "create") {
        const { roomId, name } = msg.payload;

        if (!roomId || !name) {
          return webSocket.send(
            JSON.stringify({
              type: "error",
              text: "Invalid room ID or name",
            })
          );
        }

        if (rooms.has(roomId)) {
          const data = JSON.stringify({
            type: "error",
            text: "Room already exist, Please Join",
          });
          return webSocket.send(data);
        }

        rooms.set(roomId, new Set());
        rooms.get(roomId)?.add(webSocket);
        users.set(webSocket, { room: roomId, name: name });

        const createData = JSON.stringify({
          type: "system",
          text: `${name} created & joined the room`,
        });

        webSocket.send(createData);

        webSocket.send(
          JSON.stringify({
            type: "created",
            payload: { roomId, name },
          })
        );

        return;
      }

      if (msg.type === "chat") {
        const msgText = msg.payload.text;
        const userInfo = users.get(webSocket);

        if (!userInfo || !msgText) return;

        const { room, name } = userInfo;

        const data = JSON.stringify({
          type: "chat",
          payload: {
            name,
            text: msgText,
          },
        });

        rooms.get(room)?.forEach((member) => {
          if (member !== webSocket) {
            member.send(data);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      webSocket.send(
        JSON.stringify({
          type: "error",
          text: "Invalid message format",
        })
      );
    }
  });

  webSocket.on("close", () => {
    const userInfo = users.get(webSocket);
    if (userInfo) {
      const { name, room } = userInfo;

      const roomSet = rooms.get(room);
      if (roomSet) {
        roomSet.delete(webSocket);
        const leaveData = JSON.stringify({
          type: "system",
          text: `${name} left the room`,
        });
        roomSet.forEach((member) => {
          if (member !== webSocket) {
            member.send(leaveData);
          }
        });
        if (roomSet.size === 0) {
          rooms.delete(room);
          console.log(`Room ${room} deleted (empty)`);
        }
      }
    }

    users.delete(webSocket);
    console.log("Client disconnected");
  });
});