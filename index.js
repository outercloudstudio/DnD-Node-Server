
const http = require('http').createServer();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const io = require('socket.io')(http, {  
    cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"]
    }
});

let clients = []

let remote3DObjects = []

class client{
    constructor(socket, ID){
        this.socket = socket;
        this.ID = ID;
    }
}

class Remote3DObject{
    constructor(object, builder, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){
        this.dirty = false

        if(object != null){
            this.builder = object.builder;
            this.x = object.x;
            this.y = object.y;
            this.z = object.z;
            this.rx = object.rx;
            this.ry = object.ry;
            this.rz = object.rz;
            this.sx = object.sx;
            this.sy = object.sy;
            this.sz = object.sz;
            this.ID = object.ID;
        }else{
            this.builder = builder;
            this.x = x;
            this.y = y;
            this.z = z;
            this.rx = rx;
            this.ry = ry;
            this.rz = rz;
            this.sx = sx;
            this.sy = sy;
            this.sz = sz;
            this.ID = uuidv4();
        }
    }

    toObject(){
        return {
            builder: this.builder,
            x: this.x,
            y: this.y,
            z: this.z,
            rx: this.rx,
            ry: this.ry,
            rz: this.rz,
            sx: this.sx,
            sy: this.sy,
            sz: this.sz,
            ID: this.ID
        }
    }

    update(object){
        if(object != null){
            this.x = object.x;
            this.y = object.y;
            this.z = object.z;
            this.rx = object.rx;
            this.ry = object.ry;
            this.rz = object.rz;
            this.sx = object.sx;
            this.sy = object.sy;
            this.sz = object.sz;
        }
    }
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomFloatFromInterval(min, max) {
    return Math.random() * (max - min) + min
}

function savePlayerData(data, auth){
    let json = JSON.stringify(data)

    if(!fs.existsSync('./players/')){
        fs.mkdirSync('./players/')
    }

    fs.writeFileSync('./players/' + auth + '.json', json)
}

function joinRoom(socket, clientID){
    if(fs.existsSync('./players/' + clients[clientID].ID + '.json')){
        let gameData = JSON.parse(fs.readFileSync('./GameData.json').toString())

        let data = {
            player: JSON.parse(fs.readFileSync('./players/' + clients[clientID].ID + '.json').toString()),
            gameData: gameData
        }

        socket.emit('joined-room', data)
    }
}

function updateRemotes(){
    let data = []

    for (let i = 0; i < remote3DObjects.length; i++) {
        if(remote3DObjects[i].dirty){
            data.push(remote3DObjects[i].toObject());
        }
    }

    io.emit('update-remotes', data);
}

io.on('connection', (socket) => {
    clients.push(new client(socket, 'Guest-' + uuidv4()))

    clientID = clients.length - 1

    socket.on('send-auth', authData => {
        console.log('Received Auth');
        
        if(authData.proposed == 'Guest'){
            let ID = uuidv4()

            console.log('New user: ' + ID + ' logged in!');

            clients[clientID].ID = ID

            socket.emit('new-user-accepted-auth', ID)
        }else{
            console.log('Existing user: ' + authData.proposed + ' logged in!');
    
            clients[clientID].ID = authData.proposed

            socket.emit('accepted-auth', authData.proposed)
        }
    });

    socket.on('join-room', () =>{
        joinRoom(socket, clientID)

        for (let i = 0; i < remote3DObjects.length; i++) {
            socket.emit('create-remote-3D-object', remote3DObjects[i].toObject())
        }
    })

    socket.on('created-character', characterData => {
        savePlayerData(characterData, clients[clientID].ID)

        socket.emit('request-auth', clients[clientID].ID)
    })

    socket.on('update-player-data', data => {
        console.log('Updating player data: ' + clients[clientID].ID)

        savePlayerData(data, clients[clientID].ID)
    })
    
    socket.on('update-remote', data => {
        //console.log('Updating remote: ' + data.ID);

        let remote = remote3DObjects.find(remote => remote.ID == data.ID)

        if(remote != null){
            remote.update(data)

            remote.dirty = true
        }

        updateRemotes()
    })

    socket.on('new-miniture', type => {
        remote3DObjects.push(new Remote3DObject(null, 'miniture-' + type, randomFloatFromInterval(-.2, .2), .7, randomFloatFromInterval(-.2, .2), 0, 0, 0, 1, 1, 1))
        io.emit('create-remote-3D-object', remote3DObjects[remote3DObjects.length-1].toObject())
    })

    socket.on('delete-minitures', () => {
        console.log('Deleting minitures')

        for (let i = 0; i < remote3DObjects.length; i++) {
            if(remote3DObjects[i].builder.substring(0, 8) == 'miniture'){
                io.emit('delete-remote-3D-object', remote3DObjects[i].ID)

                remote3DObjects.splice(i, 1)

                i--
            }
        }
    })

    socket.on('delete-remote-3D-object', ID => {
        io.emit('delete-remote-3D-object', ID)

        let remote = remote3DObjects.find(remote => remote.ID == ID)

        if(remote != null){
            remote3DObjects.splice(remote3DObjects.indexOf(remote), 1)
        }
    })

    console.log('User connected!')

    socket.emit('request-auth', clients[clientID].ID)
});

io.on('disconnect', socket => {
    for (let i = 0; i < clients.length; i++) {
        if(clients[i].socket.id == socket.id){
            clients.splice(i, 1)
        }
    }
})

http.listen(25566, () => console.log('listening on http://localhost:25566') );