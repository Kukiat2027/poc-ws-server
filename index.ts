import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";

const PORT = Number(process.env.PORT ?? 3003);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server running");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 120000,
  pingInterval: 25000,
});

io.on("connection", (socket: Socket) => {
  console.log(`[connect] ${socket.id}`);

  socket.emit("welcome", {
    id: socket.id,
    message: "Connected to Socket.IO server",
    at: new Date().toISOString(),
  });

  socket.on("ping", (payload, ack?: (data: unknown) => void) => {
    const reply = { pong: true, received: payload, at: Date.now() };
    if (typeof ack === "function") ack(reply);
    else socket.emit("pong", reply);
  });

  socket.on("join", (room: string) => {
    if (!room) return;
    socket.join(room);
    socket.emit("joined", { room });
    socket.to(room).emit("peer:joined", { id: socket.id, room });
    console.log(`[join] ${socket.id} -> ${room}`);
  });

  socket.on("leave", (room: string) => {
    if (!room) return;
    socket.leave(room);
    socket.emit("left", { room });
    socket.to(room).emit("peer:left", { id: socket.id, room });
  });

  socket.on(
    "message",
    (data: { room?: string; text: string }) => {
      const msg = {
        from: socket.id,
        text: data?.text ?? "",
        at: new Date().toISOString(),
      };
      console.log(`[message]`, msg);
      if (data?.room) {
        io.to(data.room).emit("message", { ...msg, room: data.room });
      } else {
        socket.broadcast.emit("message", msg);
      }
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`[disconnect] ${socket.id} (${reason})`);
  });

  socket.on("error", (err) => {
    console.error(`[error] ${socket.id}:`, err);
    socket.emit("error", { message: "An error occurred", detail: err?.message || err });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on http://localhost:${PORT}`);
});
