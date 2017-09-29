// evenWarmer.js
// create Request and Response constructors...

class Request {
  constructor(httpRequest) {
    this.httpRequest = httpRequest;

    const lines = httpRequest.split('\r\n').map(line => line.trim());
    const firstEmptyLineIndex = lines.indexOf('');

    [this.method, this.path, this.headers, this.body] = lines.reduce((arr, line, index) => {
      const [method, path, headers, body] = arr;
      if (line !== '') {
        if (index === 0) { // line is the request line
          const [theMethod, thePath] = line.split(' ', 2);
          return [theMethod, thePath, headers, body];
        } else if (index < firstEmptyLineIndex) { // line is a header line
          const [key, val] = line.split(': ', 2);
          headers[key] = val;
          return [method, path, headers, body];
        } else { return [method, path, headers, body + line]; } // line is a body line
      }
      return [method, path, headers, body];
      }, ['', '', {}, '']);
  }

  toString() { return this.httpRequest; }
}

module.exports = { Request };

//------------------------------------------------------------------------------

const net = require('net');
const HOST = '127.0.0.1';
const PORT = 8080;

const server = net.createServer(sock => {
  sock.on('data', binaryData => {
    let statusLine;
    let headerFields;
    let body;

    const req = new Request(String(binaryData));

    switch (req.path) {
      case '/':
        statusLine = 'HTTP/1.1 200 OK';
        headerFields = 'Content-Type: text/html; charset=UTF-8';
        body = '<link rel="stylesheet" type="text/css" href="http://localhost:8080/foo.css"><h2>this is a red header!</h2><em>Hello</em> <strong>World</strong>';
        break;
      case '/foo.css':
        statusLine = 'HTTP/1.1 200 OK';
        headerFields = 'Content-Type: text/css; charset=UTF-8';
        body = 'h2 {color: red;}';
        break;
      default:
        statusLine = 'HTTP/1.1 404 PAGE_NOT_FOUND';
        headerFields = 'Content-Type: text/plain; charset=UTF-8';
        body = 'uh oh... 404 page not found!';
        break;
    }

    const newLine = '\r\n';
    const response = `${statusLine}${newLine}${headerFields}${newLine}${newLine}${body}`;
    sock.end(response);
  });
});

server.listen(PORT, HOST);
