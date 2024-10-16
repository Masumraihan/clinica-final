import { Server, createServer } from "http";
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import seedAdmin from "./app/DB";
import initializeSocketIo from "./socket";

let server: Server;
export const io = initializeSocketIo(createServer(app));
async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    seedAdmin();

    server = app.listen(Number(config.port), config.ip as string, () => {
      console.log(`Example app listening on port ${config.port}`);
    });

    io.listen(Number(config.socket_port));
    console.log(`Socket is listening on port ${config.ip} : ${8003}`);
    global.socketio = io;
  } catch (error) {
    console.log(error);
  }
}

main();

process.on("unhandledRejection", (error) => {
  console.log(error);
  console.log("unhandledRejection detected server shutting down 😈");

  if (server) {
    server.close(() => process.exit(1));
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.log(error);
  console.log("uncaughtException detected server shutting down 😈");
  process.exit(1);
});
