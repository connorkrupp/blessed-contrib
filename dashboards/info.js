var blessed = require('blessed')
  , contrib = require('../index')

var screen = blessed.screen()

//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

/*
 *
 * LCD Options
//these options need to be modified epending on the resulting positioning/size
  options.segmentWidth = options.segmentWidth || 0.06; // how wide are the segments in % so 50% = 0.5
  options.segmentInterval = options.segmentInterval || 0.11; // spacing between the segments in % so 50% = 0.5
  options.strokeWidth = options.strokeWidth || 0.11; // spacing between the segments in % so 50% = 0.5
//default display settings
  options.elements = options.elements || 3; // how many elements in the display. or how many characters can be displayed.
  options.display = options.display || 321; // what should be displayed before anything is set
  options.elementSpacing = options.spacing || 4; // spacing between each element
  options.elementPadding = options.padding || 2; // how far away from the edges to put the elements
//coloring
  options.color = options.color || "white";
*/
var lcdLineOne = grid.set(0,9,2,3, contrib.lcd,
  {
    label: "Current Time",
    segmentWidth: 0.06,
    segmentInterval: 0.11,
    strokeWidth: 0.1,
    elements: 8,
    display: "00:00",
    elementSpacing: 4,
    elementPadding: 4
  }
);

setInterval(function(){
    var colors = ['green','magenta','cyan','red','blue'];

    var d = new Date();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();
    if (hours < 10) {
	hours = "0" + hours;
    }
    if (minutes < 10) {
	minutes = "0" + minutes;
    }
    if (seconds < 10) {
	seconds = "0" + seconds;
    }
    lcdLineOne.setDisplay(hours  + ":" + minutes + ":" + seconds);
    lcdLineOne.setOptions({
	color: 'white',
    });
    screen.render()
}, 1000);

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render()
