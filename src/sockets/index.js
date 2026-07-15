import { Server } from "socket.io";

let ioInstance = null;

// Emits real-time events to the admin dashboard: new orders, payments,
// low stock alerts, new reviews. Extend with auth middleware + rooms per role.
export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    socket.on("join_admin", () => socket.join("admins"));
    socket.on("join_customer", (userId) => socket.join(`customer:${userId}`));
    socket.on("disconnect", () => {});
  });

  ioInstance = io;
  return io;
};

// Lets event listeners (which don't have access to the httpServer) reach Socket.IO
// without importing sockets/index.js into every listener file.
export const getIO = () => ioInstance;
