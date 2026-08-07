const { spawn } = require("child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const options = { stdio: "inherit", shell: true };

const server = spawn(npmCommand, ["run", "dev", "--prefix", "server"], options);
const client = spawn(npmCommand, ["run", "dev", "--prefix", "client"], options);

function stop() {
  server.kill("SIGTERM");
  client.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
