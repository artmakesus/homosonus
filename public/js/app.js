'use strict';

// Configuration
const bSimulate = true;
const bUseReverb = true;
const bUseOSC = false;
const bodySize = 10;

if (bSimulate) {
	var dummyX = -9999,
		dummyY = -9999;
}

// Sound stuff
var sounds = new Array(6),
	volumes = new Array(6),
	soundPositions = new Array(6),
	nextSoundPositions = new Array(6),
	soundFilenames = [
		'sounds/0.wav',
		'sounds/1.wav',
		'sounds/2.wav',
		'sounds/3.wav',
		'sounds/4.wav',
		'sounds/5.wav',
	];

if (bUseReverb) {
	var reverbs = new Array(6);
}

// Body stuff
var bodies,
	bodyPositions = new Array(6);

function preload() {
	if (!bUseOSC) {
		for (let i = 0; i < 6; i++) {
			sounds[i] = loadSound(soundFilenames[i]);
			if (bUseReverb) {
				sounds[i].disconnect();
				reverbs[i] = new p5.Reverb();
				reverbs[i].process(sounds[i], 1, 3);
			}
		}
	}
}

function setup() {
	createCanvas(displayWidth, displayHeight);
	background(0);

	setupSounds();
	setupSoundPositions();
	randomizeSoundPositions();

	if (bSimulate) {
		processData();
	} else {
		fetchData();
	}
}

function setupSounds() {
	for (let i in sounds) {
		sounds[i].setVolume(0.01);
		sounds[i].loop();
		sounds[i].play();
	}
}

function setupSoundPositions() {
	soundPositions = [
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
	];
}

function randomizeSoundPositions() {
	nextSoundPositions = [
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
		{ x: Math.random() * windowWidth, y: Math.random() * windowHeight },
	];

	setTimeout(function() {
		randomizeSoundPositions();
	}, Math.random() * 10000);
}

function draw() {
	updateSoundPositions();
	fadeBackground();
	drawSounds();
	drawBodies();
}

function updateSoundPositions() {
	for (let i in soundPositions) {
		let dx = nextSoundPositions[i].x - soundPositions[i].x;
		let dy = nextSoundPositions[i].y - soundPositions[i].y;
		let angle = Math.atan2(dy, dx);
		soundPositions[i].x += Math.cos(angle);
		soundPositions[i].y += Math.sin(angle);
	}
}

function fadeBackground() {
	noStroke();
	fill(0, 16);
	rect(0, 0, width, height);
}

function drawSounds() {
	stroke(255);
	noFill();

	for (let i in soundPositions) {
		let soundSize = 100 * volumes[i];
		ellipse(soundPositions[i].x, soundPositions[i].y, soundSize, soundSize);
	}
}

function drawBodies() {
	noStroke();
	fill(255);

	if (bSimulate) {
		ellipse(dummyX, dummyY, bodySize, bodySize);
	} else {
		for (let i in bodyPositions) {
			if (bodyPositions[i] && bodies[i].tracked) {
				noStroke();
				fill(255);
				ellipse(bodyPositions[i].x, bodyPositions[i].y, bodySize, bodySize);
			}
		}
	}
}

function fetchData() {
	$.ajax({
		url: '/data',
		method: 'GET',
		dataType: 'json',
	}).done(function(data) {
		processData(data);
	}).fail(function(response) {
		requestAnimationFrame(fetchData);
	});
}

function processData(data) {
	// Reset volumes for calculation
	for (let i in soundPositions) {
		volumes[i] = 0;
	}

	// Manipulate sounds if there are bodies
	if (bSimulate) {
		manipulateSounds({ x: dummyX, y: dummyY });
		requestAnimationFrame(processData);
	} else {
		let hasBody = false;

		bodies = data;
		for (let i in bodies) {
			let body = bodies[i];
			if (!body.tracked) {
				continue;
			}

			hasBody = true;

			// See https://msdn.microsoft.com/en-us/library/microsoft.kinect.jointtype.aspx
			// for joint types
			let joint = body.joints[0];
			bodyPositions[i] = {
				x: joint.cameraX * windowWidth * 0.25 + windowWidth * 0.5,
				y: joint.cameraZ * (windowHeight * 0.25),
			};

			manipulateSounds(bodyPositions[i], joint);
		}

		if (!bUseOSC && !hasBody) {
			for (let i in volumes) {
				volumes[i] = constrain(volumes[i] - 0.01, 0, 1);
				if (bUseReverb) {
					let ampVolume = constrain(volumes[i] * 2, 0, 1);
					let fadeTime = 1;
					let timeFromNow = 0;
					sounds[i].amp(ampVolume, fadeTime, timeFromNow);
				} else {
					sounds[i].setVolume(volumes[i]);
				}
			}
		}

		requestAnimationFrame(fetchData);
	}

	sendOSCData();
}

function manipulateSounds(bodyPosition, joint) {
	for (let i in soundPositions) {
		// Calculate distance between sound and body
		let distance = dist(soundPositions[i].x, soundPositions[i].y, bodyPosition.x, bodyPosition.y);
		let tmpVolume = constrain(1 - Math.cbrt(distance) * 0.125, 0, 1) * 2;

		if (tmpVolume > volumes[i]) {
			volumes[i] = tmpVolume;
			if (!bUseOSC) {
				if (bUseReverb) {
					let ampVolume = constrain(volumes[i] * 2, 0, 1); 
					//let fadeTime = 1;
					//let timeFromNow = 0;
					sounds[i].amp(ampVolume);
				} else {
					sounds[i].setVolume(volumes[i]);
				}
			}
		}

	}
}

function sendOSCData() {
	$.ajax({
		url: '/volumes',
		method: 'PUT',
		data: {
			volumes: JSON.stringify(volumes),
		},
	});
}

function mouseMoved() {
	dummyX = mouseX;
	dummyY = mouseY;
}
