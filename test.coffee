
midi = require('midi')

count = 0

parser = (port, msg) ->
    channel = msg[0] % 16 + 1
    switch msg[0] / 16  # message type
      when 0xB
        ["/#{channel}/cc/#{msg[1]}", msg[2]/127.0]
      when 0x9  # note on
        ["/#{channel}/note/#{msg[1]}", msg[2]/127.0]
      when 0x8  # note off
        ["/#{channel}/note/#{msg[1]}", 0]
      when 0xE
        ["/#{channel}/pitchbend/", msg[1]/127.0]
      else
        ___ undefined, 'message:', msg...

start = (midi_in, port, virtual=no) ->
  console.log("Opening port #{port} - #{midi_in.getPortName(port)}")

  midi_in["open#{virtual and 'Virtual' or ''}Port"] port
  midi_in.on 'message', (deltaTime, msg) ->
    count++
    console.log("#{count}: message received #{parser(port, msg)}")

# This works just fine
test1 = ->
  midi_in1 = new midi.input()

  start(midi_in1, 0)
  console.log('Test 1: Listening to port')

# This causes crashes after a few messages.
test2 = ->
  midi_in1 = new midi.input()
  midi_in2 = new midi.input()

  start(midi_in1, 0)
  console.log('Test 2: Listening to port')

# This works just fine.
test3 = ->
  midi_in1 = new midi.input()
  midi_in2 = new midi.input()

  start(midi_in1, 0)
  start(midi_in2, 0)
  console.log('Test 3: Listening to port')

# This issues a warning but works as expected.
test4 = ->
  midi_in1 = new midi.input()
  
  start(midi_in1, 0)
  start(midi_in1, 0)
  console.log('Test 4: Listening to port')

'''
This code tests the node-midi functionality under different situations. Test 2 causes crashes while the other tests do not.

Steps to reproduce crash:
- Install MidiKeys on OSX 10.10
- Launch MidiKeys
- Install coffee-script if you don't have it
- Checkout project and npm install in the root directory.
- Run test2 below using `coffee midi-test.coffee`
- Focus MidiKeys
- Type random letters for around 30 seconds.
'''
#test1()
#test2()
test3()
#test4()
