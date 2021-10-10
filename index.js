
const http = require('http').createServer()
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const io = require('socket.io')(http, {  
    cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"]
    }
})
const THREE = require('three')
const CANNON = require('cannon')


class Collider{
    constructor(colliderShape){
        this.shape = colliderShape
    }

    toObject(){
        return {
            shape: this.shape.toObject()
        }
    }

    init(gameObject){
        this.gameObject = gameObject
    }
}

class SphereCollider{
    constructor(radius){
        this.radius = radius
        this.type = 'Sphere'
    }

    toObject(){
        return {
            type: 'Sphere',
            radius: this.radius
        }
    }
}

class BoxCollider{
    constructor(scale){
        this.scale = scale
        this.type = 'Box'
    }

    toObject(){
        return {
            type: 'Box',
            scale: this.scale
        }
    }
}

class PolygonCollider{
    constructor(points, faces = null){
        this.points = points
        this.faces = faces
        this.type = 'Polygon'

        if(faces == null){
            let result = GeometryToData(points)

            this.points = result.vertices
            this.faces = result.faces
        }
    }

    toObject(){
        return {
            type: 'Polygon',
            points: this.points,
            faces: this.faces,
        }
    }
}

class D20Collider{
    constructor(){
        this.type = 'D20'
    }

    toObject(){
        return {
            type: 'D20',
        }
    }
}

class Component{
    constructor(value, networked){
        this.value = value
        this.networked = networked
        this.type = 'Unkown'
    }

    toObject(){
        return {
            type: this.type,
            value: this.value.toObject(),
            networked: this.networked,
        }
    }

    init(gameObject){
        if(this.value instanceof Transform){
            this.type = 'Transform'
        }

        if(this.value instanceof Renderer){
            this.type = 'Renderer'
        }

        if(this.value instanceof Collider){
            this.type = 'Collider'
        }

        if(this.value instanceof RigidBody){
            this.type = 'RigidBody'
        }

        this.value.init(gameObject)
    }

    Update(deltaTime){
        if(this.value.Update != null){
            this.value.Update(deltaTime)
        }
    }

    PreUpdate(deltaTime){
        if(this.value.PreUpdate != null){
            this.value.PreUpdate(deltaTime)
        }
    }
}

class Transform{
    constructor(position, rotation, scale){
        this.position = position
        this.rotation = rotation
        this.scale = scale
    }

    toObject(){
        return {
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
        }
    }

    init(gameObject){
        this.gameObject = gameObject
    }

    RemoteUpdate(){
        return {
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
        }
    }
}

class Renderer{
    constructor(builder){
        this.builder = builder
    }

    toObject(){
        return {
            builder: this.builder,
        }
    }

    init(gameObject){
        this.gameObject = gameObject

        this.addToScene(scene)
    }

    addToScene(scene){
        if(this.object3D == null){
            if(this.builder == 'cube'){
                let geometry = new THREE.BoxGeometry(this.sx, this.sy, this.sz)

                let material = new THREE.MeshPhongMaterial({
                    color: 0xFFFFFF,
                    flatShading: true,
                })

                this.object3D = new THREE.Mesh(geometry, material);

                let transform = this.gameObject.GetComponent('Transform')

                this.object3D.position.set(transform.position.x, transform.position.y, transform.position.z)
                this.object3D.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
                this.object3D.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)

                updateMaterialHDRI(this.object3D)

                scene.add(this.object3D)
            }

            if(this.builder == 'miniture-base'){
				loader.load('./models/Human_Female_Barbarian.fbx', object =>{
                    this.object3D = object

                    this.object3D.position.set(0, 0, 0)
                    this.object3D.rotation.set(0, 0, 0)
                    this.object3D.scale.set(1, 1, 1)

                    let transform = this.gameObject.GetComponent('Transform')

                    this.object3D.position.set(transform.position.x, transform.position.y, transform.position.z)
                    this.object3D.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
                    this.object3D.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)

                    updateMaterialHDRI(object)
                    
                    selectables.add(this.object3D)
                })
            }

            if(this.builder == "plane"){
                let geometry = new THREE.PlaneGeometry(this.sx, this.sy, this.sz)

                let material = new THREE.MeshPhongMaterial({
                    color: 0xFFFFFF,
                    flatShading: true,
                })

                this.object3D = new THREE.Mesh(geometry, material);

                let transform = this.gameObject.GetComponent('Transform')

                this.object3D.position.set(transform.position.x, transform.position.y, transform.position.z)
                this.object3D.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
                this.object3D.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)

                updateMaterialHDRI(this.object3D)

                scene.add(this.object3D)
            }

            if(this.builder == 'D20'){
				loader.load('./models/D20.fbx', object =>{
                    this.object3D = object

                    this.object3D.position.set(0, 0, 0)
                    this.object3D.rotation.set(0, 0, 0)
                    this.object3D.scale.set(1, 1, 1)

                    let transform = this.gameObject.GetComponent('Transform')

                    this.object3D.position.set(transform.position.x, transform.position.y, transform.position.z)
                    this.object3D.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
                    this.object3D.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)

                    this.object3D.children[0].rotation.set(0, 0, 0)

                    updateMaterialHDRI(object, D20Texture)
                    
                    selectables.add(this.object3D)
                })
            }
        }
    }

    Update(deltaTime){
        if(this.object3D != null){
            let transform = this.gameObject.GetComponent('Transform')

            this.object3D.position.set(transform.position.x, transform.position.y, transform.position.z)
            this.object3D.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
            this.object3D.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)
        }
    }
}

class RigidBody{
    constructor(mass){
        this.mass = mass
    }

    toObject(){
        return {
            mass: this.mass,
            velocity: this.rigidBody.velocity,
            //TODO: Add angular velocity
        }
    }

    init(gameObject){
        this.gameObject = gameObject

        let collider = this.gameObject.GetComponent('Collider')

        let colliderShape = null

        let transform = this.gameObject.GetComponent('Transform')

        let collisionGroup = 1
        let collisionMask = 1 | 2

        if(collider.shape.type == 'Box'){
            colliderShape = new CANNON.Box(new CANNON.Vec3(collider.shape.scale.x * transform.scale.x, collider.shape.scale.y  * transform.scale.y, collider.shape.scale.z  * transform.scale.z))
        }else if(collider.shape.type == 'Sphere'){
            colliderShape = new CANNON.Sphere(collider.shape.radius * transform.scale.x)
        }else if(collider.shape.type == 'D20'){
            let result = GeometryToData(D20Geometry)
            console.log(result)

            for (let i = 0; i < result.vertices.length; i++) {
                result.vertices[i].x *= transform.scale.x
                result.vertices[i].y *= transform.scale.y
                result.vertices[i].z *= transform.scale.z
            }

            colliderShape = new CANNON.ConvexPolyhedron(result.vertices, result.faces)

            collisionGroup = 2
            collisionMask = 1
        }else{
            console.error('Collider type ' + collider.shape.type + ' not supported')
        }

        let bodyMaterial = new CANNON.Material()    

        this.rigidBody = new CANNON.Body({ mass: this.mass, material: bodyMaterial, collisionFilterGroup: collisionGroup, collisionFilterMask: collisionMask })

        this.rigidBody.position.set(transform.position.x, transform.position.y, transform.position.z)
        this.rigidBody.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)

        this.rigidBody.addShape(colliderShape)
        this.rigidBody.linearDamping = physicsDamping

        physicsWorld.add(this.rigidBody)
    }

    PreUpdate(deltaTime){
        let transform = this.gameObject.GetComponent('Transform')

        transform.position.set(this.rigidBody.position.x, this.rigidBody.position.y, this.rigidBody.position.z)
        transform.rotation.set(this.rigidBody.quaternion.x, this.rigidBody.quaternion.y, this.rigidBody.quaternion.z, this.rigidBody.quaternion.w)

        //TODO: update collider based on scale
    }

    RemoteUpdate(){
        return{
            velocity: this.rigidBody.velocity,
        }
    }
}

class GameObject{
    constructor(components, owner = null){
        this.dirty = false
        this.components = components
        this.owner = owner

        if(this.owner == null){
            this.owner = false
        }

        this.ID = uuidv4()

        for (let i = 0; i < components.length; i++) {
            components[i].init(this)
        }
    }

    toObject(asOwner){
        let components = []

        for (let i = 0; i < this.components.length; i++) {
            components.push(this.components[i].toObject())    
        }

        return {
            ID: this.ID,
            components: components,
            owner: this.owner && !asOwner,
        }
    }

    GetComponent(componentType){
        for (let i = 0; i < this.components.length; i++) {
            if(this.components[i].type == componentType){
                return this.components[i].value
            }
        }
    }

    Update(deltaTime){
        if(this.components){
            for (let i = 0; i < this.components.length; i++) {
                this.components[i].PreUpdate(deltaTime)
            }
        }

        if(this.components){
            for (let i = 0; i < this.components.length; i++) {
                this.components[i].Update(deltaTime)
            }
        }
    }

    RemoteUpdate(){
        let updateData = []

        for (let i = 0; i < this.components.length; i++) {
            if(this.components[i].networked){
                if(this.components[i].RemoteUpdate() != null){
                    updateData.push({
                        type: this.components[i].type,
                        data: this.components[i].RemoteUpdate(),
                    })
                }
            }
        }

        if(updateData.length > 0){
            updateData = {
                ID: this.ID,
                data: updateData,
            }

            socket.emit('update-game-object', updateData)
        }
    }

    Reconstruct(object){
        this.ID = object.ID
        this.dirty = false
        this.owner = object.owner

        this.components = []

        for (let i = 0; i < object.components.length; i++) {
            let component = object.components[i]
            let componentType = component.type
            let componentValue = component.value
            let componentNetworked = component.networked

            if(componentType == 'Transform'){
                this.components.push(
                    new Component(
                        new Transform(new THREE.Vector3(componentValue.position.x, componentValue.position.y, componentValue.position.z), new THREE.Quaternion(componentValue.rotation.x, componentValue.rotation.y, componentValue.rotation.z, componentValue.rotation.w), new THREE.Vector3(componentValue.scale.x, componentValue.scale.y, componentValue.scale.z)),
                        componentNetworked
                    )
                )
            }else if(componentType == 'Renderer'){
                this.components.push(
                    new Component(
                        new Renderer(componentValue.builder),
                        componentNetworked
                    )
                )
            }else if(componentType == 'RigidBody'){
                this.components.push(
                    new Component(
                        new RigidBody(componentValue.mass),
                        componentNetworked
                    )
                )
            }else if(componentType == 'Collider'){
                if(componentValue.shape.type == 'Box'){
                    this.components.push(
                        new Component(
                            new Collider(
                                new BoxCollider(new THREE.Vector3(componentValue.shape.scale.x, componentValue.shape.scale.y, componentValue.shape.scale.z)),
                            ),
                            componentNetworked
                        )
                    )
                }else if(componentValue.shape.type == 'Sphere'){
                    this.components.push(
                        new Component(
                            new Collider(
                                new SphereCollider(componentValue.shape.radius),
                            ),
                            componentNetworked
                        )
                    )
                }else if(componentValue.shape.type == 'D20'){
                    this.components.push(
                        new Component(
                            new Collider(
                                new D20Collider(),
                            ),
                            componentNetworked
                        )
                    )
                }else{
                    console.error('Collider type ' + componentValue.shape.type + ' not supported')
                }
            }else{
                console.error('Component type ' + componentType + ' not supported')
            }
        }

        this.init()

        for (let i = 0; i < object.components.length; i++) {
            let component = object.components[i]
            let componentType = component.type
            let componentValue = component.value
            let componentNetworked = component.networked

            if(componentType == 'RigidBody'){
                let rigidBody = this.GetComponent('RigidBody').rigidBody
                rigidBody.velocity.set(componentValue.velocity.x, componentValue.velocity.y, componentValue.velocity.z)
            }
        }
    }

    init(){
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].init(this)
        }
    }

    //TODO: network componenets

    /*update(object, lerpPos = false){
        if(object != null){
            this.x = object.x
            this.y = object.y
            this.z = object.z
            this.targetX = object.x
            this.targetY = object.y
            this.targetZ = object.z
            this.rx = object.rx
            this.ry = object.ry
            this.rz = object.rz
            this.sx = object.sx
            this.sy = object.sy
            this.sz = object.sz
        }

        if(this.object3D != null){
            if(!lerpPos){
                this.object3D.position.set(this.x, this.y, this.z)
            }

            this.object3D.rotation.set(this.rx, this.ry, this.rz)

            console.log(this.sx)
            this.object3D.scale.set(this.sx, this.sy, this.sz)
        }
    }

    updateValues(){
        this.x = this.object3D.position.x
        this.y = this.object3D.position.y
        this.z = this.object3D.position.z
        this.targetX = this.object3D.position.x
        this.targetY = this.object3D.position.y
        this.targetZ = this.object3D.position.z
        this.rx = this.object3D.rotation.x
        this.ry = this.object3D.rotation.y
        this.rz = this.object3D.rotation.z
        this.sx = this.object3D.scale.x
        this.sy = this.object3D.scale.y
        this.sz = this.object3D.scale.z

        this.dirty = true
    }*/
}

let clients = []

let remote3DObjects = []

let gameObjects = []

let clientIDOffset = 0

class client{
    constructor(socket, ID, data){
        this.socket = socket
        this.ID = ID
        this.data = data
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

function savePlayerData(data, auth, clientID){
    clients[clientID + clientIDOffset].data = data

    let json = JSON.stringify(data)

    if(!fs.existsSync('./players/')){
        fs.mkdirSync('./players/')
    }

    fs.writeFileSync('./players/' + auth + '.json', json)
}

function joinRoom(socket, clientID){
    if(fs.existsSync('./players/' + clients[clientID + clientIDOffset].ID + '.json')){
        let gameData = JSON.parse(fs.readFileSync('./GameData.json').toString())
        let playerData = JSON.parse(fs.readFileSync('./players/' + clients[clientID + clientIDOffset].ID + '.json').toString())

        console.log(playerData.playerName + ' has joined the room.')

        clients[clientID + clientIDOffset].data = playerData

        let data = {
            player: playerData,
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
    clients.push(new client(socket, 'Guest-' + uuidv4(), null))

    clientID = clients.length - 1 - clientIDOffset

    socket.on('send-auth', authData => {
        console.log('Received Auth');
        
        if(authData.proposed == 'Guest'){
            let ID = uuidv4()

            console.log('New user: ' + ID + ' logged in!');

            clients[clientID + clientIDOffset].ID = ID

            socket.emit('new-user-accepted-auth', ID)
        }else{
            console.log('Existing user: ' + authData.proposed + ' logged in!');
    
            clients[clientID + clientIDOffset].ID = authData.proposed

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
        savePlayerData(characterData, clients[clientID + clientIDOffset].ID, clientID)

        socket.emit('request-auth', clients[clientID + clientIDOffset].ID)
    })

    socket.on('update-player-data', data => {
        console.log('Updating player data: ' + clients[clientID] + clientIDOffset.ID)

        savePlayerData(data, clients[clientID + clientIDOffset].ID, clientID)
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

    socket.on('get-players', () => {
        console.log('Getting players')

        let data = []

        for (let i = 0; i < clients.length; i++) {
            if(clientID + clientIDOffset != i){
                data.push(clients[i].data)
            }
        }

        socket.emit('set-players', data)
    })

    socket.on('disconnect', socket => {
        clients.splice(clientID + clientIDOffset, 1)
        clientIDOffset--
    })

    socket.on('create-game-object', object => { 
        gameObjects.push(object)

        socket.broadcast.emit('create-game-object', object)
    })

    socket.on('update-game-object', object => {
        socket.broadcast.emit('update-game-object', object)
    })

    console.log('User connected!')

    socket.emit('request-auth', clients[clientID + clientIDOffset].ID)
})

http.listen(25566, () => console.log('listening on http://localhost:25566') );

//funny vid for whover is reading this :) https://www.youtube.com/watch?v=B_y5IzQ_VB8