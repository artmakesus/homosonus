// Prepare sound buffers
(
// Change soundsDir to fit the path on your system
var soundsDir = "/home/jacky/Projects/homosonus/supercollider/sounds/";
~buffers = [
	Buffer.read(s, soundsDir + "0.wav"),
	Buffer.read(s, soundsDir + "1.wav"),
	Buffer.read(s, soundsDir + "2.wav"),
	Buffer.read(s, soundsDir + "3.wav"),
	Buffer.read(s, soundsDir + "4.wav"),
	Buffer.read(s, soundsDir + "5.wav"),
];
)

// Create synth defs
(
for (0, 5, {
	arg i;
	SynthDef("s"++i, {
		arg out = 0, buf, mul = 1;
		Out.ar( out,
			FreeVerb.ar(
				PlayBuf.ar(1, buf, BufRateScale.kr(buf), loop: 1),
				1,
				0.33,
				0.5,
				mul
			)
		)
	}).add;
});
)

// Create synths
(
a = Synth.new(\s0, [\buf, ~buffers[0].bufnum]);
b = Synth.new(\s1, [\buf, ~buffers[1].bufnum]);
c = Synth.new(\s2, [\buf, ~buffers[2].bufnum]);
d = Synth.new(\s3, [\buf, ~buffers[3].bufnum]);
e = Synth.new(\s4, [\buf, ~buffers[4].bufnum]);
f = Synth.new(\s5, [\buf, ~buffers[5].bufnum]);
)

// Initialize volumes to zero
(
a.set(\mul, 0);
b.set(\mul, 0);
c.set(\mul, 0);
d.set(\mul, 0);
e.set(\mul, 0);
f.set(\mul, 0);
)

// Listen to OSC messages
(
o = OSCFunc({
	arg msg;

	// Update volumes
	a.set(\mul, msg[1]);
	b.set(\mul, msg[2]);
	c.set(\mul, msg[3]);
	d.set(\mul, msg[4]);
	e.set(\mul, msg[5]);
	f.set(\mul, msg[6]);

	msg.postln;
}, '/volumes', nil, 57120);
)

// Free synths
a.free; b.free; c.free; d.free; e.free; f.free;

'done'.postln;