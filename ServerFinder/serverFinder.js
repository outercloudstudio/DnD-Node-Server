const { exec } = require("child_process")
const { spawn } = require("child_process")
const fs = require("fs")
const ping = require('ping')
const tcpp = require('tcp-ping')

const config = {
    timeout: 3,
}

let scanned = 0

function detectIP(){
    console.log(scanned)

    let ip = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))+"."+(Math.floor(Math.random() * 255))

    //console.log('Pinging: ' + ip)

    /*ping.sys.probe('mc.hypixel.net', isAlive => {
        var msg = isAlive ? 'host ' + ip + ' is alive' : 'host ' + ip + ' is dead'
        console.log(msg)

        if(isAlive){
            fs.appendFileSync('ServerLog.txt', ip + '\n')
        }

        detectIP()
    }, config)*/

    tcpp.ping({
        address: ip,
        port: 25565,
        attempts: 1,
        timeout: 100,
    }, (err, data) => {
        //console.log(data)
        
        let available = !isNaN(data.avg)

        //let msg = available ? 'host ' + ip + ' is alive' : 'host ' + ip + ' is dead'
        //console.log(msg)

        if(available){
            console.log('Found ip: ' + ip)
            fs.appendFileSync('ServerLog.txt', ip + '\n')
        }

        scanned++
        detectIP()
    });
}

for (let i = 0; i < 128; i++) {
    detectIP()
}