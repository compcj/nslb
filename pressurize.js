const net = require('net');

for (let i = 0; i < 2000; i++) {
    let c = net.createConnection(9000, 'localhost', () => {
        c.end('123');
    });
}