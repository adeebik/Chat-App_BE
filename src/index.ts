import { WebSocketServer } from "ws";
const wss = new WebSocketServer({ port: 8000 });

wss.on("connection" ,function(socket){
    console.log("userConnected");
    setInterval(()=>{
        socket.send("Current Price Of Gold : " + (Math.random()*1000))
    }, 5000)

    socket.on("message" , (e)=>{
        console.log(e.toString());
        
    })
})