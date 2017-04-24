'use strict';
var fs = require('fs');
var path = require('path');
var wpi = require('wiring-pi');

// Use MQTT protocol to communicate with IoT hub
	var Client = require('azure-iot-device').Client;
	var ConnectionString = require('azure-iot-device').ConnectionString;
	var Message = require('azure-iot-device').Message;
	var Protocol = require('azure-iot-device-mqtt').Mqtt;

// WiringPi pin number of the Vibration Sensor

	var WASHER = 0;
	var DRYER = 2;

// Prepare for WiringPi operations
	wpi.setup('wpi');
	wpi.pinMode(WASHER, wpi.INPUT);
	wpi.pinMode(DRYER, wpi.INPUT);

// Read device connection string from command line arguments and parse it
	var connectionStringParam = process.argv[2];
	var connectionString = ConnectionString.parse(connectionStringParam);
//var connectionString = "HostName=hub-sharedlaundry.azure-devices.net;DeviceId=SL-RaspberryPi;SharedAccessKey=VwV8ByvMXGRinESaMev2Os/efM12lAGWWPo3Dqq/6Ks="
	var deviceId = connectionString.DeviceId;

// fromConnectionString must specify a transport constructor, coming from any transport package.
	var client = Client.fromConnectionString(connectionStringParam, Protocol);
//var client = clientFromConnectionString(connectionString, Protocol)

// Configure the client to use X509 authentication if required by the connection string.
	if (connectionString.x509) {
  // Read X.509 certificate and private key.
  // These files should be in the current folder and use the following naming convention:
  // [device name]-cert.pem and [device name]-key.pem, example: myraspberrypi-cert.pem
  		var options = {
		    cert : fs.readFileSync(path.join(__dirname, deviceId + '-cert.pem')).toString(),
		    key : fs.readFileSync(path.join(__dirname, deviceId + '-key.pem')).toString()
  			};
	
		  client.setOptions(options);

		  console.log('[Device] Using X.509 client certificate authentication');
		}

/**
 * Start sending messages after getting connected to IoT Hub.
 * If there is any error, log the error message to console.
 * @param {string}  err - connection error
 */
	function connectCallback(err) {
  	if (err) {
    		console.log('[Device] Could not connect: ' + err);
  	} else {
    		console.log('[Device] Client connected\n');
    // Wait for 5 seconds so that host machine gets connected to IoT Hub for receiving message.
    setTimeout(TestVibration, 5000);
 	 }
	}

	 function printResultFor(op) {
   	 return function printResult(err, res) {
     	 if (err) console.log(op + ' error: ' + err.toString());
     	 if (res) console.log(op + ' status: ' + res.constructor.name);
   		};
 	}

/**
* Test Vibration.
*/
var washerstate = 0;
var dryerstate = 0;

function TestVibration() {


	if(wpi.digitalRead(WASHER) == 1)
   	  {
      	   //console.log("1");
	   if(washerstate != 1)
	   {
		   washerstate = 1;
               	   var data = JSON.stringify({ machine: 'Washer001', Status: '1' });
	           var message = new Message(data);
		   console.log("************");
                   console.log("WASHER is ON");
		   console.log("************");
	           console.log("Sending message: " + message.getData());
 	           client.sendEvent(message, printResultFor('send'));
	   }
         }
	
	else    
         {
          //console.log("0");
	  if(washerstate != 0)
	  {
                  washerstate = 0;
	          var data = JSON.stringify({ machine: 'Washer001', Status: '0' });
	          var message = new Message(data);
		  console.log("*************");
		  console.log("WASHER is OFF");
		  console.log("*************");
	          console.log("Sending message: " + message.getData());
	          client.sendEvent(message, printResultFor('send'));
	  }
         }

       

	if(wpi.digitalRead(DRYER) == 1)
   	 {
      	   //console.log("1");
	   if(dryerstate != 1)
	   {
		dryerstate = 1;
      	   	var data = JSON.stringify({ machine: 'Dryer001', Status: '1' });
           	var message = new Message(data);
		console.log("***********");
                console.log("DRYER is ON");
		console.log("***********");
           	console.log("Sending message: " + message.getData());
          	client.sendEvent(message, printResultFor('send'));
	   }
         }

        else
         {
           //console.log("0");
	   if(dryerstate != 0)
	   {
		dryerstate = 0;
          	var data = JSON.stringify({ machine: 'Dryer001', Status: '0' });
                var message = new Message(data);
		console.log("************");
                console.log("DRYER is OFF");
		console.log("************");
          	console.log("Sending message: " + message.getData());
          	client.sendEvent(message, printResultFor('send'));
	   }
         }
          setTimeout(function(){ TestVibration() }, 2000);
       }

// Connect to IoT Hub and send messages via the callback.
	client.open(connectCallback);

