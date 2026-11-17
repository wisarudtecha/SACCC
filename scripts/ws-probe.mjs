// scripts/ws-probe.mjs — local WebSocket probe (no dependencies).
//
// Purpose: prove what the app ACTUALLY puts on the wire, without the real backend.
// It completes the RFC6455 handshake, logs the upgrade request and every frame it
// receives, and answers the register frame with SUBSCRIBE-SUCCESS so the app reports
// "connected".
//
// Run: node scripts/ws-probe.mjs [port]
//
// The credential is expected as a flat `access_token` field on the SUBSCRIBE frame; the
// probe shouts when it is missing.
import { createHash } from "node:crypto";
import { createServer } from "node:http";

const PORT = Number(process.argv[2] || 8899);
const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const log = (...args) => console.log("[probe]", ...args);

const encodeTextFrame = (text) => {
  const payload = Buffer.from(text, "utf8");
  if (payload.length > 125) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
};

const server = createServer((req, res) => {
  res.writeHead(426, { "Content-Type": "text/plain" });
  res.end("WebSocket probe: this endpoint only speaks WebSocket.\n");
});

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  const accept = createHash("sha1").update(key + GUID).digest("base64");

  log("UPGRADE path:", req.url);
  log("UPGRADE authorization header:", req.headers.authorization ?? "(none — expected, the browser cannot set it)");
  log("UPGRADE cookie header:", req.headers.cookie ? "(present)" : "(none)");

  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n"
    + "Upgrade: websocket\r\n"
    + "Connection: Upgrade\r\n"
    + `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );

  let buffer = Buffer.alloc(0);
  let frameCount = 0;

  socket.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const opcode = buffer[0] & 0x0f;
      const masked = (buffer[1] & 0x80) === 0x80;
      let length = buffer[1] & 0x7f;
      let offset = 2;

      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      }
      else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }

      let maskKey = null;
      if (masked) {
        if (buffer.length < offset + 4) return;
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + length) return;

      const payload = Buffer.from(buffer.subarray(offset, offset + length));
      if (maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }
      buffer = buffer.subarray(offset + length);

      if (opcode === 0x8) {
        log("CLIENT CLOSE frame");
        socket.end();
        return;
      }
      if (opcode === 0x9) {
        socket.write(Buffer.from([0x8a, 0x00])); // pong
        continue;
      }
      if (opcode !== 0x1) {
        log(`frame opcode=${opcode} (ignored)`);
        continue;
      }

      frameCount += 1;
      const text = payload.toString("utf8");
      log(`FRAME #${frameCount} RAW: ${text}`);

      try {
        const parsed = JSON.parse(text);
        log(`FRAME #${frameCount} access_token: ${parsed.access_token ? "(present)" : "(MISSING)"}`);
        if (parsed.EVENT === "SUBSCRIBE" && !parsed.access_token) {
          log(">>> NO CREDENTIAL ON THE REGISTER FRAME <<<");
        }
      }
      catch {
        log(`FRAME #${frameCount} is not JSON`);
      }

      if (text.includes("SUBSCRIBE") && !text.includes("SUBSCRIBE-SUCCESS")) {
        const reply = JSON.stringify({ type: "notification", EVENT: "SUBSCRIBE-SUCCESS" });
        socket.write(encodeTextFrame(reply));
        log("REPLIED SUBSCRIBE-SUCCESS");
      }
    }
  });

  socket.on("error", err => log("socket error:", err.message));
});

server.listen(PORT, () => log(`listening on ws://localhost:${PORT}`));
