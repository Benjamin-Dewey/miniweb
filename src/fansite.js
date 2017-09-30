// fansite.js
// create your own fansite using your miniWeb framework

const miniWebApp = require('./miniWeb.js').App;

const fanSite = new miniWebApp();

fanSite.get('/', (req, res) => res.sendFile('/html/index.html'));
fanSite.get('/home', (req, res) => res.redirect(301, 'http://localhost:8080/'));
fanSite.get('/image1.jpg', (req, res) => res.sendFile('/img/image1.jpg'));
fanSite.get('/image2.png', (req, res) => res.sendFile('/img/image2.png'));
fanSite.get('/image3.gif', (req, res) => res.sendFile('/img/image3.gif'));

fanSite.listen(8080, '127.0.0.1');
