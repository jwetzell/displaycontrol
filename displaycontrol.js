var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var SerialPort = require('serialport');
var inquirer = require('inquirer');
var config = require('./config.json');

var sonyConfig = config.sony_config;
var rs232Config = config.rs232_config;
var sonyAddresses = config.sony_config.addresses;

// const sp = new SerialPort(portname, {
//     baudRate: rs232Config.baudrate,
//     dataBits: rs232Config.databits,
//     parity: rs232Config.parity,
//     stopBits: rs232Config.stopbits,
//     flowControl: rs232Config.flowcontrol,
//     parser: new serialport.parsers.Readline("\n")
//   });

var availableCommands = Object.keys(sonyConfig.commands).filter(value=> Object.keys(rs232Config.commands).includes(value));
SerialPort.list().then((ports)=>{
    var avaliableSerialPaths = ports.map((value)=>value.path);

    inquirer.prompt([
        {
            type: 'list',
            name: 'com',
            message: 'Choose Serial Device?',
            choices: avaliableSerialPaths
        },
        {
            type: 'list',
            name: 'cmd',
            message: 'Choose command?',
            choices: availableCommands
        }
    ]).then((answers)=>{
    
        var command = answers.cmd
        
        if(sonyConfig.commands[command] != undefined){
            var cmd = sonyConfig.commands[command];
    
            sonyAddresses.forEach(ip => {
                var xhr = new XMLHttpRequest();
                xhr.onload = function() {
                    var resp = xhr.responseText;
                    console.log(resp);
                };
                xhr.open('POST', 'http://' + ip + '/sony/' + cmd.service);
    
                // if (psk) {
                //     xhr.setRequestHeader('X-Auth-PSK', psk);
                // }
    
                console.log(`Sending command <${command}> to Sony TV @ ${ip}`)
    
                xhr.send(JSON.stringify({
                    method: cmd.method,
                    version: '1.0',
                    id: 1,
                    params: cmd.params ? [cmd.params] : [],
                }));
            });
        }

        const sp = new SerialPort(answers.com, {
            baudRate: Number(rs232Config.baudrate),
            dataBits: Number(rs232Config.databits),
            parity: rs232Config.parity,
            stopBits: Number(rs232Config.stopbits),
            flowControl: rs232Config.flowcontrol,
            parser: new SerialPort.parsers.Readline("\n")
          });

        sp.write(rs232Config.commands[command], (err)=>{
            if(err){
                return console.log("Error on rs2323 write: ", err.message);
            }
            console.log(`Command <${command}> written to rs232 device on port <${answers.com}>`)
        })
        
    })
})
