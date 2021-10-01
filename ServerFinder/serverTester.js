const Net = require('net');

const port = 25565;
const host = 'mc.hypixel.net';

//resources:
//https://wiki.vg/Protocol
//https://wiki.vg/Protocol#Handshake
//https://wiki.vg/Server_List_Ping

// Create a new TCP client.
const client = new Net.Socket();

// Send a connection request to the server.
client.connect({ port: port, host: host }, () => {
    // If there is no error, the server has accepted the request and created a new 
    // socket dedicated to us.
    console.log('TCP connection established with the server.');

    // The client can now send data to the server by writing to its socket.
    //client.write('Hello, server.');
});

// The client can also receive data from the server by reading from its socket.
client.on('data', chunk => {
    console.log(`Data received from the server: ${chunk.toString()}.`);
    
    // Request an end to the connection after the data has been received.
    client.end();
});

client.on('end',() => {
    console.log('Requested an end to the TCP connection');
});