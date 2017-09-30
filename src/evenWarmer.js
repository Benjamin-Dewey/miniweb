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

class Response {
  constructor(socket) {
    this.sock = socket;
    this.headers = {};
    this.body = '';
    this.statusCode = 0;

    this.newLine = '\r\n';
    this.http = 'HTTP/1.1';
  }

  getDescriptionForStatusCode(code) {
    switch (true) {
      case code >= 100 && code <= 199: // 1xx
        return 'Received';
      case code >= 200 && code <= 299: // 2xx
        return 'OK';
      case code >= 300 && code <= 399: // 3xx
        return code === 302 ? 'Found' : code === 301 ? 'Moved Permanently' : 'See Other';
      case code >= 400 && code <= 499: // 4xx
        return code === 404 ? 'Not Found' : 'Bad Request';
      case code >= 500 && code <= 599: // 5xx
        return 'Internal Server Error';
      default:
        return 'None';
    }
  }

  setHeader(name, value) { this.headers[name] = value; }

  write(data) { this.sock.write(data); }

  end(s) { this.sock.end(s); }

  send(statusCode, body) {
    this.statusCode = statusCode;
    this.body = body;

    const statusLine = `${this.http} ${statusCode} ${this.getDescriptionForStatusCode(statusCode)}`;
    const headerLines = Object.keys(this.headers).reduce((str, key) => {
      return `${str === '' ? '' : str + this.newLine}${key}: ${this.headers[key]}`;
    }, '');
    const response = `${statusLine}${this.newLine}${headerLines}${headerLines === '' ? '' : this.newLine}${this.newLine}${body}`;

    this.end(response);
  }

  writeHead(statusCode) {
    this.statusCode = statusCode;

    const statusLine = `${this.http} ${statusCode} ${this.getDescriptionForStatusCode(statusCode)}`;
    const headerLines = Object.keys(this.headers).reduce((str, key) => {
      return `${str === '' ? '' : str + this.newLine}${key}: ${this.headers[key]}`;
    }, '');
    const response = `${statusLine}${this.newLine}${headerLines}`;

    this.write(response);
  }

  redirect(...args) {
    const [statusCode, url] = args.length === 1 ? [301, ...args] : args;

    this.statusCode = statusCode;
    this.setHeader('Location', url);

    const statusLine = `${this.http} ${statusCode} ${this.getDescriptionForStatusCode(statusCode)}`;
    const headerLines = Object.keys(this.headers).reduce((str, key) => {
      return `${str === '' ? '' : str + this.newLine}${key}: ${this.headers[key]}`;
    }, '');
    const response = `${statusLine}${this.newLine}${headerLines}`;

    this.end(response);
  }

  toString() {
    const statusLine = `${this.http} ${this.statusCode} ${this.getDescriptionForStatusCode(this.statusCode)}`;
    const headerLines = Object.keys(this.headers).reduce((str, key) => {
      return `${str === '' ? '' : str + this.newLine}${key}: ${this.headers[key]}`;
    }, '');
    return `${statusLine}${this.newLine}${headerLines}${headerLines === '' ? '' : this.newLine}${this.newLine}${this.body}`;
  }
}

module.exports = { Request, Response };

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
        statusLine = 'HTTP/1.1 404 Not Found';
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
