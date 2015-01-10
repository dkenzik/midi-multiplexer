
var _ = require('lodash');
var midi = require('midi');

var inPort = 0;
var outPort = 0;
var maps = [
  {    // {channel, cc, val}
    "in": { type: 'cc', channel: 1, value: [50,1] }, 
    "out": [ { type: 'cc', channel: 1, value: [51,1] }, 
             { type: 'cc', channel: 1, value: [51,2] } ]
  },
  {    // {channel, note, val}
    "in": { type: 'note', channel: 1, value: [1] }, 
    "out": [ { type: 'note', channel: 1, value: [2,127] }, 
             { type: 'note', channel: 1, value: [3,127] } ]
  }
];

// Set up a new input and output
// TODO: Allow user to choose from a list of ports
var input = new midi.input();
var output = new midi.output();

// open ports
input.openPort(0);
output.openPort(0);

console.log("INPUT: " + inPort + " - " + (input.getPortName(inPort)));
console.log("OUTPUT: " + outPort + " - " + (input.getPortName(outPort)));

// MIDI message callback.
input.on('message', function(deltaTime, message) {
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
        console.log('Trigger Found: Channel ' + channel + ', Message: ' + type + ' ' + message[1] + ' ' + message[2]);
        _.forEach(map.out,function(o) {
          statusByte = 0xB0 + o.channel - 1;
          output.sendMessage([statusByte,o.value[0],o.value[1]]);
        });
      }
      // TODO: Look for note
      if(map.in.type == type && map.in.type=='note' && map.in.channel == channel && map.in.value[0] == message[1] ) {
        console.log('Trigger Found: Channel ' + channel + ', Message: ' + type + ' ' + message[1] + ' ' + message[2]);
        _.forEach(map.out,function(o) {
          statusByte = 0x90 + o.channel - 1;
          output.sendMessage([statusByte,o.value[0],o.value[1]]);
          output.sendMessage([statusByte,o.value[0],0]);
        });
      }
    });
  }
});

