// fansite.js
// create your own fansite using your miniWeb framework

const miniWebApp = require('./miniWeb.js').App;

const fanSite = new miniWebApp();

fanSite.get('/', (req, res) => res.sendFile('/html/index.html'));
fanSite.get('/home', (req, res) => res.redirect(301, 'http://localhost:8080/'));
fanSite.get('/about', (req, res) => res.sendFile('/html/about.html'));
fanSite.get('/rando', (req, res) => res.sendFile('/html/rando.html'));

fanSite.get('/randomImage', (req, res) => {
  const paths = ['/img/image1.jpg', '/img/image2.png', '/img/image3.gif'];
  const randomImagePath = paths[Math.floor(Math.random() * paths.length)];
  res.sendFile(randomImagePath);
});

fanSite.get('/css/base.css', (req, res) => res.sendFile('/css/base.css'));
fanSite.get('/image1.jpg', (req, res) => res.sendFile('/img/image1.jpg'));
fanSite.get('/image2.png', (req, res) => res.sendFile('/img/image2.png'));
fanSite.get('/image3.gif', (req, res) => res.sendFile('/img/image3.gif'));

fanSite.listen(8080, '127.0.0.1');
