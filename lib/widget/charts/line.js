var blessed = require('blessed')
   , Node = blessed.Node
   , Canvas = require('../canvas')
   , utils = require('../../utils.js')
   , _ = require('lodash')

function Line(options) {

  var self = this

  if (!(this instanceof Node)) {
    return new Line(options);
  }

  options.showNthLabel = options.showNthLabel || 1
  options.style = options.style || {}
  options.style.line = options.style.line || "yellow"
  options.style.text = options.style.text || "green"
  options.style.baseline = options.style.baseline || "black"
  options.xLabelPadding = options.xLabelPadding || 5
  options.xPadding = options.xPadding || 10
  options.numYLabels = options.numYlabels || 5
  options.legend = options.legend || {}
  options.wholeNumbersOnly = options.wholeNumbersOnly || false
  Canvas.call(this, options);
}

Line.prototype.calcSize = function() {
    this.canvasSize = {width: this.width*2-12, height: this.height*4-8}
}

Line.prototype.__proto__ = Canvas.prototype;

Line.prototype.type = 'line';

Line.prototype.setData = function(data) {

    if (!this.ctx) {
      throw "error: canvas context does not exist. setData() for line charts must be called after the chart has been added to the screen via screen.append()"
    }

    //compatability with older api
    if (!Array.isArray(data)) data = [data]

    var self = this
    var xLabelPadding = this.options.xLabelPadding
    var yLabelPadding = 3
    var xPadding = this.options.xPadding
    var yPadding = 11
    var c = this.ctx
    var labels = data[0].x

    function addLegend() {
      if (!self.options.showLegend) return
      if (self.legend) self.remove(self.legend)
      var legendWidth = self.options.legend.width || 15
      self.legend = blessed.box({
            height: data.length+2,
            top: 1,
            width: legendWidth,
            left: self.width-legendWidth-3,
            content: '',
            fg: "green",
            tags: true,
            border: {
              type: 'line',
              fg: 'black'
            },
            style: {
              fg: 'blue',
            },
            screen: self.screen
          });

      var legandText = ""
      var maxChars = legendWidth-2
      for (var i=0; i<data.length; i++) {
        var style = data[i].style || {}
        var color = style.line || self.options.style.line
        legandText += '{'+color+'-fg}'+ data[i].title.substring(0, maxChars)+'{/'+color+'-fg}\r\n'
      }
      self.legend.setContent(legandText)
      self.append(self.legend)
    }

//iteratee for lodash _.max
    function getMax(v, i){
      return parseFloat(v);
    }
//for some reason this loop does not properly get the maxY if there are multiple datasets (was doing 4 datasets that differred wildly)
//just used lodash _.max utility
    function getMaxY() {

      var max = 0;
      var setMax = [];

      for(var i = 0; i < data.length; i++) {
        if (data[i].y.length)
          setMax[i] = _.max(data[i].y, getMax);

        for(var j = 0; j < data[i].y.length; j++) {
          if(data[i].y[j] > max) {
            max = data[i].y[j];
          }
        }
      }

      var m = _.max(setMax, getMax);

      max = m*1.2;

      max*=1.2
      if (self.options.maxY) {
        return Math.max(max, self.options.maxY)
      }

      return max;
    }

    function abbreviateNumber(value) {
        var newValue = value;
        if (value >= 1000) {
            var suffixes = ["", "k", "m", "b","t"];
            var suffixNum = Math.floor( (""+value).length/3 );
            var shortValue = '';
            for (var precision = 2; precision >= 1; precision--) {
                shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
                var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
                if (dotLessShortValue.length <= 2) { break; }
            }
            if (shortValue % 1 != 0)  shortNum = shortValue.toFixed(1);
            newValue = shortValue+suffixes[suffixNum];
        }
        return newValue;
    }

    function formatYLabel(value, max, numLabels, wholeNumbersOnly, abbreviate) {
      var fixed = (max/numLabels<1 && value!=0 && !wholeNumbersOnly) ? 2 : 0
      var res = value.toFixed(fixed)
      return abbreviate?abbreviateNumber(res):res
    }

    function getMaxXLabelPadding(numLabels, wholeNumbersOnly, abbreviate) {
      var max = getMaxY()

      return formatYLabel(max, max, numLabels, wholeNumbersOnly, abbreviate).length * 2;
    }

    var maxPadding = getMaxXLabelPadding(this.options.numYLabels, this.options.wholeNumbersOnly, this.options.abbreviate)
    if (xLabelPadding < maxPadding) {
      xLabelPadding = maxPadding;
    };

    if ((xPadding - xLabelPadding) < 0) {
      xPadding = xLabelPadding;
    }

    function getMaxX() {
      var maxLength = 0;

      for(var i = 0; i < labels.length; i++) {
        if(labels[i] === undefined) {
          console.log("label[" + i + "] is undefined");
        } else if(labels[i].length > maxLength) {
          maxLength = labels[i].length;
        }
      }

      return maxLength;
    }

    function getXPixel(val) {
        return ((self.canvasSize.width - xPadding) / labels.length) * val + (xPadding * 1.0) + 2;
    }

    function getYPixel(val) {
        var res = self.canvasSize.height - yPadding - (((self.canvasSize.height - yPadding) / getMaxY()) * val);
        res-=2 //to separate the baseline and the data line to separate chars so canvas will show separate colors
        return res
    }

    // Draw the line graph
    function drawLine(values, style) {
      style = style || {}
      var color = self.options.style.line
      c.strokeStyle = style.line || color

      c.moveTo(0, 0)
      c.beginPath();
      c.lineTo(getXPixel(0), getYPixel(values[0]));

      for(var k = 1; k < values.length; k++) {
          c.lineTo(getXPixel(k), getYPixel(values[k]));
      }

      c.stroke();
    }

    addLegend()

    c.fillStyle = this.options.style.text

    c.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);


    var yLabelIncrement = getMaxY()/this.options.numYLabels
    if (this.options.wholeNumbersOnly) yLabelIncrement = Math.floor(yLabelIncrement)
    //if (getMaxY()>=10) {
    //  yLabelIncrement = yLabelIncrement + (10 - yLabelIncrement % 10)
    //}

    //yLabelIncrement = Math.max(yLabelIncrement, 1) // should not be zero

    if (yLabelIncrement==0) yLabelIncrement = 1

    // Draw the Y value texts
    var maxY = getMaxY()
    for(var i = 0; i < maxY; i += yLabelIncrement) {
        c.fillText(formatYLabel(i, maxY, this.options.numYLabels, this.options.wholeNumbersOnly, this.options.abbreviate), xPadding - xLabelPadding, getYPixel(i));
    }

    for (var h=0; h<data.length; h++) {
      drawLine(data[h].y, data[h].style)
    }


    c.strokeStyle = this.options.style.baseline

    // Draw the axises
    c.beginPath();

    c.lineTo(xPadding, 0);
    c.lineTo(xPadding, this.canvasSize.height - yPadding);
    c.lineTo(this.canvasSize.width, this.canvasSize.height - yPadding);

    c.stroke();

    // Draw the X value texts
    var charsAvailable = (this.canvasSize.width - xPadding) / 2;
    var maxLabelsPossible = charsAvailable / (getMaxX() + 2);
    var pointsPerMaxLabel = Math.ceil(data[0].y.length / maxLabelsPossible);
    var showNthLabel = this.options.showNthLabel;
    if (showNthLabel < pointsPerMaxLabel) {
      showNthLabel = pointsPerMaxLabel;
    }

    for(var i = 0; i < labels.length; i += showNthLabel) {
      if((getXPixel(i) + (labels[i].length * 2)) <= this.canvasSize.width) {
        c.fillText(labels[i], getXPixel(i), this.canvasSize.height - yPadding + yLabelPadding);
      }
    }

}

Line.prototype.getOptionsPrototype = function() {
  return { width: 80
         , height: 30
         , left: 15
         , top: 12
         , xPadding: 5
         , label: 'Title'
         , showLegend: true
         , legend: {width: 12}
         , data: [ { title: 'us-east',
                   x: ['t1', 't2', 't3', 't4'],
                   y: [5, 1, 7, 5],
                   style: {
                    line: 'red'
                   }
                 }
               , { title: 'us-west',
                   x: ['t1', 't2', 't3', 't4'],
                   y: [2, 4, 9, 8],
                   style: {line: 'yellow'}
                 }
                , {title: 'eu-north-with-some-long-string',
                   x: ['t1', 't2', 't3', 't4'],
                   y: [22, 7, 12, 1],
                   style: {line: 'blue'}
                 }]

         }
}

module.exports = Line
