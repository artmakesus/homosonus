'use strict';

const bSimulate = true;

if (bSimulate) {
	const express = require('express');
	let app = express();

	app.use(express.static('public'));
	app.get('/data', function(r, w) {
		w.send(bodies);
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
