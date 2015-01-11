var _ = require('lodash');
var midi = require('midi');

var inPort = 9;
var outPort = 3;
var maps = [
  // PLAY ALL
  {    // {channel, cc, val}
    "in": { type: 'note', channel: 1, value: [126,127] }, 
    "out": [ { type: 'note', channel: 1, value: [12,127] }, 
             { type: 'note', channel: 1, value: [22,127] },
             { type: 'note', channel: 1, value: [32,127] },
             { type: 'note', channel: 1, value: [42,127] },
             { type: 'note', channel: 1, value: [52,127] },
             { type: 'note', channel: 1, value: [62,127] },
             { type: 'note', channel: 1, value: [72,127] },
             { type: 'note', channel: 1, value: [82,127] },]
  },
  // STOP ALL, RESET TRANSPORT, SELECT LOOPBUS
  {    // {channel, cc, val}
    "in": { type: 'note', channel: 1, value: [127,127] },
    "out": [ { type: 'note', channel: 1, value: [18,127] },
             { type: 'note', channel: 1, value: [28,127] },
             { type: 'note', channel: 1, value: [38,127] },
             { type: 'note', channel: 1, value: [48,127] },
             { type: 'note', channel: 1, value: [58,127] },
             { type: 'note', channel: 1, value: [68,127] },
             { type: 'note', channel: 1, value: [78,127] },
             { type: 'note', channel: 1, value: [88,127] },
             { type: 'note', channel: 1, value: [124,127] }, // stop
             { type: 'note', channel: 1, value: [124,127] }, // stop
             { type: 'cc', channel: 1, value: [50,0] }, // select lp1
             { type: 'note', channel: 1, value: [99,127] },] // select track
  },
  // CLEAR ALL, RESET TRANSPORT, SELECT LOOPBUS
  {    // {channel, cc, val}
    "in": { type: 'note', channel: 1, value: [125,127] },
    "out": [ { type: 'note', channel: 1, value: [19,127] },
             { type: 'note', channel: 1, value: [29,127] },
             { type: 'note', channel: 1, value: [39,127] },
             { type: 'note', channel: 1, value: [49,127] },
             { type: 'note', channel: 1, value: [59,127] },
             { type: 'note', channel: 1, value: [69,127] },
             { type: 'note', channel: 1, value: [79,127] },
             { type: 'note', channel: 1, value: [89,127] },
             { type: 'note', channel: 1, value: [124,127] },
             { type: 'note', channel: 1, value: [124,127] },
             { type: 'cc', channel: 1, value: [50,0] }, // select lp1
             { type: 'note', channel: 1, value: [99,127] },]
  },

];

// Set up a new input and output
// TODO: Allow user to choose from a list of ports
var input = new midi.input();
var output = new midi.output();

// open ports
input.openPort(inPort);
output.openPort(outPort);

console.log("INPUT: " + inPort + " - " + (input.getPortName(inPort)));
console.log("OUTPUT: " + outPort + " - " + (input.getPortName(outPort)));

// MIDI message callback.
input.on('message', function(deltaTime, message) {

  // console.log(message);

  // Pass original message through
  output.sendMessage(message);

  //  console.log("Received Message: " + message);
  var channel = message[0] % 16 + 1;
  var type;

  // TODO: Figure why this isn't coming back as a real HEX, eg '0xB0'
  switch (Math.floor(message[0] / 16 ).toString(16)) {
    case '8': 
    case '9': 
      type = 'note';
      break;
    case 'b':
      type = 'cc';
      break;
    default:
      type = false;  
  }
  // Process input
  if(type) {
    _.forEach(maps,function(map) {
      var statusByte;
      // See if any of the IN's match
      // Look for cc's
      if(map.in.type == type && map.in.type=='cc' && map.in.channel == channel && map.in.value[0] == message[1] && map.in.value[1] == message[2] ) {
        console.log('Trigger Detected: Channel ' + channel + ', Message: ' + type + ' ' + message[1] + ' ' + message[2]);
        _.forEach(map.out,function(o) {
          statusByte = 0xB0 + o.channel - 1;
          output.sendMessage([statusByte,o.value[0],o.value[1]]);
        });
      }
      // Look for note
      if(map.in.type == type && map.in.type=='note' && map.in.channel == channel && map.in.value[0] == message[1] && map.in.value[1] == message[2] ) {
        console.log('Trigger Found: Channel ' + channel + ', Message: ' + type + ' ' + message[1] + ' ' + message[2]);
        _.forEach(map.out,function(o) {
	  if(o.type == 'note') {
            statusByte = 0x90 + o.channel - 1;
            output.sendMessage([statusByte,o.value[0],o.value[1]]);
            // note off
            output.sendMessage([statusByte,o.value[0],0]);
          } 
          if(o.type == 'cc') {
            statusByte = 0xB0 + o.channel - 1;
            output.sendMessage([statusByte,o.value[0],o.value[1]]);
          }
        });
      }
    });
  }
});


