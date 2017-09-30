// miniWeb.js
// define your Request, Response and App objects here

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
    const response = `${statusLine}${this.newLine}${headerLines}${headerLines === '' ? '' : this.newLine}${this.newLine}`;

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
    const response = `${statusLine}${this.newLine}${headerLines}${this.newLine}${this.newLine}`;

    this.end(response);
  }

  toString() {
    const statusLine = `${this.http} ${this.statusCode} ${this.getDescriptionForStatusCode(this.statusCode)}`;
    const headerLines = Object.keys(this.headers).reduce((str, key) => {
      return `${str === '' ? '' : str + this.newLine}${key}: ${this.headers[key]}`;
    }, '');
    return `${statusLine}${this.newLine}${headerLines}${headerLines === '' ? '' : this.newLine}${this.newLine}${this.body}`;
  }

  sendFile(fileName) {
    let contentType;
    let encodingObj = {};
    switch (fileName.split('.')[1]) {
        case 'html':
          contentType = 'text/html';
          encodingObj = {encoding: "utf8"};
          break;
        case 'css':
          contentType = 'text/css';
          encodingObj = {encoding: "utf8"};
          break;
        case 'txt':
          contentType = 'text/plain';
          encodingObj = {encoding: "utf8"};
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'jpg':
          contentType = 'image/jpeg';
          break;
        default: // unkown file extension
          this.send(500, '500 Internal Server Error');
          return;
    }

    require('fs').readFile(`${__dirname}/../public${fileName}`, encodingObj, (err, data) => {
      if (err) { this.send(500, '500 Internal Server Error'); }
      else {
        this.setHeader('Content-Type', contentType + (encodingObj.hasOwnProperty('encoding') ? '; charset=UTF-8' : ''));
        this.writeHead(200);
        this.end(data);
      }
    });
  }
}

class App {
  constructor() {
    this.routes = {};
    this.server = require('net').createServer(sock => {
      this.handleConnection(sock);
      sock.on('error', err => console.log(err));});
  }

  get(path, cb) { this.routes[path] = cb; }

  listen(port, host) { this.server.listen(port, host); }

  handleConnection(sock) { sock.on('data', binaryData => this.handleRequestData(sock, binaryData)); }

  handleRequestData(sock, binaryData) {
    const req = new Request(String(binaryData));
    const res = new Response(sock);

    sock.on('close', () => this.logResponse(req, res));

    if (!req.headers.hasOwnProperty('Host')) {
      res.send(400, '400 Bad Request');
      return;
    }

    const path = req.path !== '/' && req.path[req.path.length - 1] === '/' ? req.path.slice(0, req.path.length - 1) : req.path;
    const handle = this.routes[path];

    if (handle) { handle(req, res); }
    else { res.send(404, '404 Page Not Found'); }
  }

  logResponse(req, res) {
    console.log(req.method, req.path);
    console.log(res.statusCode, res.getDescriptionForStatusCode(res.statusCode));
  }
}

module.exports = { App };
