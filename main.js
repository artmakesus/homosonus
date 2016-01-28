'use strict';

// Modules
const express = require('express');
const bodyParser = require('body-parser');
const osc = require('node-osc');

// Configuration
const bSimulate = true;
const oscUpdateInterval = 10;

let app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let oscClient = new osc.Client('127.0.0.1', 57120);
let oscCounter = 0;

if (bSimulate) {
	app.put('/volumes', function(r, w) {
		try {
			oscCounter = (oscCounter + 1) % oscUpdateInterval;
			if (oscCounter == 0) {
				let volumes = JSON.parse(r.body.volumes);
				oscClient.send(
					'/volumes',
					volumes[0],
					volumes[1],
					volumes[2],
					volumes[3],
					volumes[4],
					volumes[5]
				);
				console.log(volumes);
			}
			w.sendStatus(200);
		} catch (error) {
			w.sendStatus(500);
			console.log(error);
		}
	});

	let server = app.listen(8080, function() {
		var host = server.address().address;
		var port = server.address().port;
		console.log('Homosonus is listening at http://%s:%s', host, port);
	});
} else {
	const Kinect2 = require('kinect2');

	let app = express();
	let kinect = new Kinect2();
	let bodies;

	if (kinect.open()) {
		kinect.on('bodyFrame', function(bodyFrame) {
			bodies = bodyFrame.bodies;
		});

		kinect.openBodyReader();

		app.use(express.static('public'));
		app.get('/data', function(r, w) {
			w.send(bodies);
		});

		let server = app.listen(8080, function() {
			var host = server.address().address;
			var port = server.address().port;
			console.log('Homosonus is listening at http://%s:%s', host, port);
		});
	}
}
