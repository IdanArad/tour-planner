import net from "node:net";

export interface CapturedEmail {
  from: string;
  to: string[];
  data: string;
}

export interface FakeSmtp {
  messages: CapturedEmail[];
  close: () => Promise<void>;
}

// Recipients at this domain get a 550 so send failures can be tested
export const REJECT_DOMAIN = "rejected.tour-planner.test";

function address(line: string) {
  return line.match(/<([^>]*)>/)?.[1] ?? "";
}

// Minimal SMTP sink: accepts mail on localhost and keeps it in memory.
// No TLS and no auth — just enough of the protocol for nodemailer.
export function startFakeSmtp(port: number): Promise<FakeSmtp> {
  const messages: CapturedEmail[] = [];
  const sockets = new Set<net.Socket>();

  const server = net.createServer((socket) => {
    let buffer = "";
    let inData = false;
    let current: CapturedEmail = { from: "", to: [], data: "" };

    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.setEncoding("utf8");
    socket.write("220 localhost ESMTP e2e\r\n");

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          messages.push(current);
          current = { from: "", to: [], data: "" };
          inData = false;
          socket.write("250 OK queued\r\n");
          continue;
        }

        const eol = buffer.indexOf("\r\n");
        if (eol === -1) return;
        const line = buffer.slice(0, eol);
        buffer = buffer.slice(eol + 2);
        const command = line.toUpperCase();

        if (command.startsWith("MAIL FROM:")) {
          current.from = address(line);
          socket.write("250 OK\r\n");
        } else if (command.startsWith("RCPT TO:")) {
          const recipient = address(line);
          if (recipient.endsWith(`@${REJECT_DOMAIN}`)) {
            socket.write("550 Mailbox rejected\r\n");
          } else {
            current.to.push(recipient);
            socket.write("250 OK\r\n");
          }
        } else if (command === "DATA") {
          inData = true;
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (command === "QUIT") {
          socket.end("221 Bye\r\n");
        } else {
          // EHLO, HELO, RSET, NOOP
          socket.write("250 OK\r\n");
        }
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve({
        messages,
        close: () =>
          new Promise<void>((done) => {
            sockets.forEach((socket) => socket.destroy());
            server.close(() => done());
          }),
      });
    });
  });
}
