// warmUp.js

const net = require('net');
const HOST = '127.0.0.1';
const PORT = 8080;

const server = net.createServer(sock => {
  sock.on('data', () => {
    const newLine = '\r\n';
    const statusLine = 'HTTP/1.1 200 OK';
    const headerFields = 'Content-Type: text/html; charset=UTF-8';
    const body = '<em>Hello</em> <strong>World</strong>';
    const response = `${statusLine}${newLine}${headerFields}${newLine}${newLine}${body}`;
    sock.end(response);
  });
});

server.listen(PORT, HOST);
