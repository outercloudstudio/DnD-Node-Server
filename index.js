
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

    RemoteUpdate(){
        return this.value.RemoteUpdate()
    }

    ReceiveUpdate(update){
        this.value.ReceiveUpdate(update)
    }

    PrePhysicsUpdate(deltaTime){
        if(this.value.PrePhysicsUpdate != null){
            this.value.PrePhysicsUpdate(deltaTime)
        }
    }

    Destroy(){
        if(this.value.Destroy != null){
            this.value.Destroy()
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

    ReceiveUpdate(update){
        this.position = new THREE.Vector3(update.position.x, update.position.y, update.position.z)
        this.rotation = new THREE.Quaternion(update.rotation._x, update.rotation._y, update.rotation._z, update.rotation._w)
        this.scale = new THREE.Vector3(update.scale.x, update.scale.y, update.scale.z)
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

        //this.addToScene(scene)
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

                //updateMaterialHDRI(this.object3D)

                //scene.add(this.object3D)
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

    PrePhysicsUpdate(deltaTime){
        if(this.object3D != null){
            if(transformer.object == this.object3D){
                let transform = this.gameObject.GetComponent('Transform')

                transform.position.set(this.object3D.position.x, this.object3D.position.y, this.object3D.position.z)
                transform.rotation.set(this.object3D.quaternion.x, this.object3D.quaternion.y, this.object3D.quaternion.z, this.object3D.quaternion.w)
                transform.scale.set(this.object3D.scale.x, this.object3D.scale.y, this.object3D.scale.z)
            }
        }
    }

    Destroy(){
        /*if(this.object3D != null){
            if(transformer.object == this.object3D){
                transformer.detach()
            }

            this.object3D.removeFromParent()
        }*/
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

        let colliderShape = new CANNON.Box(new CANNON.Vec3(.5, .5, .5))

        let transform = this.gameObject.GetComponent('Transform')

        let collisionGroup = 1
        let collisionMask = 1 | 2

        if(collider.shape.type == 'Box'){
            colliderShape = new CANNON.Box(new CANNON.Vec3(collider.shape.scale.x * transform.scale.x, collider.shape.scale.y  * transform.scale.y, collider.shape.scale.z  * transform.scale.z))
        }else if(collider.shape.type == 'Sphere'){
            colliderShape = new CANNON.Sphere(collider.shape.radius * transform.scale.x)
        }else if(collider.shape.type == 'D20'){
            /*let result = GeometryToData(D20Geometry)

            for (let i = 0; i < result.vertices.length; i++) {
                result.vertices[i].x *= transform.scale.x
                result.vertices[i].y *= transform.scale.y
                result.vertices[i].z *= transform.scale.z
            }

            colliderShape = new CANNON.ConvexPolyhedron(result.vertices, result.faces)

            collisionGroup = 2
            collisionMask = 1*/
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

    ReceiveUpdate(data){
        this.rigidBody.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z)
    }

    PrePhysicsUpdate(deltaTime){
        let transform = this.gameObject.GetComponent('Transform')

        this.rigidBody.position.set(transform.position.x, transform.position.y, transform.position.z)
        this.rigidBody.quaternion.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w)
    }

    Destroy(){
        //physicsWorld.remove(this.rigidBody)
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
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].PreUpdate(deltaTime)
        }

        for (let i = 0; i < this.components.length; i++) {
            this.components[i].Update(deltaTime)
        }
    }

    RemoteUpdate(){
        if(this.owner){
            let updateData = []

            for (let i = 0; i < this.components.length; i++) {
                if(this.components[i].networked){
                    if(this.components[i].RemoteUpdate != null){
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
    }

    ReceiveUpdate(updateData){
        for (let i = 0; i < updateData.length; i++) {
            //console.log(updateData[i].data)
            let component = this.GetComponent(updateData[i].type)
            component.ReceiveUpdate(updateData[i].data)
        }
    }

    PrePhysicsUpdate(deltaTime){
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].PrePhysicsUpdate(deltaTime)
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
                        new Transform(new THREE.Vector3(componentValue.position.x, componentValue.position.y, componentValue.position.z), new THREE.Quaternion(componentValue.rotation._x, componentValue.rotation._y, componentValue.rotation._z, componentValue.rotation._w), new THREE.Vector3(componentValue.scale.x, componentValue.scale.y, componentValue.scale.z)),
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

    Destroy(){
        for (let i = 0; i < this.components.length; i++) {
            this.components[i].Destroy()
        }

        for (let i = 0; i < gameObjects.length; i++) {
            if(gameObjects[i] == this){
                gameObjects.splice(i, 1)
                break
            }
        }

        if(this.owner){
            socket.emit('destroy-game-object', this.ID )
        }
    }
}

const physicsWorld = new CANNON.World()

const physicsDamping = 0.01
let timeScale = 0

let clients = []

let gameObjects = []

let clientIDOffset = 0

class client{
    constructor(socket, ID, data){
        this.socket = socket
        this.ID = ID
        this.data = data
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

        for (let i = 0; i < gameObjects.length; i++) {
            socket.emit('create-game-object', gameObjects[i].toObject())
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

    /*socket.on('delete-minitures', () => {
        console.log('Deleting minitures')

        for (let i = 0; i < remote3DObjects.length; i++) {
            if(remote3DObjects[i].builder.substring(0, 8) == 'miniture'){
                io.emit('delete-remote-3D-object', remote3DObjects[i].ID)

                remote3DObjects.splice(i, 1)

                i--
            }
        }
    })*/

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
        let reconstruction = new GameObject([])
        reconstruction.Reconstruct(object)
    
        gameObjects.push(reconstruction)

        socket.broadcast.emit('create-game-object', object)
    })

    socket.on('update-game-object', object => {
        for (let i = 0; i < gameObjects.length; i++) {
            if(gameObjects[i].ID == object.ID){
                gameObjects[i].ReceiveUpdate(object.data)
            }
        }

        socket.broadcast.emit('update-game-object', object)
    })

    socket.on('destroy-game-object', ID => {
        console.log('Destroying game object: ' + ID)

        for (let i = 0; i < gameObjects.length; i++) {
            if(gameObjects[i].ID == ID){
                gameObjects[i].Destroy()
            }
        }

        socket.broadcast.emit('destroy-game-object', ID)
    })

    console.log('User connected!')

    socket.emit('request-auth', clients[clientID + clientIDOffset].ID)
})

http.listen(25566, () => console.log('listening on http://localhost:25566') );

//funny vid for whover is reading this :) https://www.youtube.com/watch?v=B_y5IzQ_VB8