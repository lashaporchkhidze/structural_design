/*  

This code is based on following convention:

https://github.com/bumbeishvili/d3-coding-conventions

*/

function renderChart(params) {

  // exposed variables
  var attrs = {
    svgWidth: 400,
    svgHeight: 400,
    marginTop: 0,
    marginBottom: 0,
    marginRight: 0,
    marginLeft: 0,
    container: 'body',
    binRadius: 200,
    binCount: 20,
    binReserved: 10,
    data: null
  };

  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })

  //innerFunctions which will update visuals
  var updateData;

  //main chart object
  var main = function (selection) {
    selection.each(function scope() {

      //calculated properties
      var calc = {}
      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;
      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      //drawing containers
      var container = d3.select(this);

      //add svg
      var svg = container.patternify({ tag: 'svg', selector: 'svg-chart-container' })
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .style('overflow', 'visible')

      var defs = svg.append('defs');

      defs.append('pattern')
        .attr('id', 'image')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 400)
        .attr('width', 400)
        .append('image')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', 400)
        .attr('width', 400)
        .attr('xlink:href', "scripts/apple.jpg")

      //add container g element
      var chart = svg.patternify({ tag: 'g', selector: 'chart' })
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')');

      var count = attrs.binCount;
      var reserved = attrs.binReserved;


      var divisors = [];
      var optimalProportion = null;
      var min = Infinity;
      var diff = calc.chartWidth / (calc.chartHeight + 80);

      for (var i = count; i < count + reserved; i++) {
        findDivisors(i, divisors);
      }
      var obj = {};
      divisors.forEach(d => {
        var dividorsDiff = d.a / d.b;
        var possibleMin = Math.abs(dividorsDiff - diff);
        if (possibleMin < min) {

          obj.binWidth = d.a;
          obj.binHeight = d.b;
          obj.windowProportion = diff;
          obj.binProportion = dividorsDiff;
          obj.diff = possibleMin;
          console.table(obj)
          min = possibleMin;
          optimalProportion = d;
        }
      });


      //The number of columns and rows of the heatmap
      var MapColumns = optimalProportion.a,
        MapRows = optimalProportion.b;



      //The maximum radius the hexagons can have to still fit the screen
      var hexRadius = d3.min([calc.chartWidth / ((MapColumns + 0.5) * Math.sqrt(3)),
      calc.chartHeight / ((MapRows + 1 / 3) * 1.5)]);

      //Set the new height and width of the SVG based on the max possible
      calc.chartWidth = MapColumns * hexRadius * Math.sqrt(3);
      calc.chartHeight = MapRows * 1.5 * hexRadius + 0.5 * hexRadius;

      //Set the hexagon radius
      var hexbin = d3.hexbin()
        .radius(hexRadius);

      //Calculate the center positions of each hexagon	
      var points = [];
      for (var i = 0; i < MapRows; i++) {
        for (var j = 0; j < MapColumns; j++) {
          points.push([hexRadius * j * 1.75, hexRadius * i * 1.5]);
        }//for j
      }//for i


      var color = d3.scaleSequential(d3.interpolateLab("white", "steelblue"))
        .domain([0, 20]);


      var slideGroup = chart.append('g');
      var hexGroup = slideGroup.append('g');

      hexGroup.append("g")
        .attr("class", "hexagon")
        .selectAll("path")
        .data(hexbin(points))
        .enter()
        .append("path")
        .attr("d", hexbin.hexagon())
        .attr("transform", function (d) { return "translate(" + (d.x - 10) + "," + (d.y + 20) + ")"; })
        .attr("fill", function (d) { return "blue" })
        .attr('fill', "url(#image)")
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseenter', function (d) {
          d3.select(this).attr('stroke', 'white');
          chart.selectAll(".hexagon path")
            .sort(function (a, b) {
              // select the parent and sort the path's     
              if (a != d) return -1; // a is not the hovered element, send "a" to the back     
              else return 1; // a is the hovered element, bring "a" to the front     
            });
        }).on('mouseleave', function () {
          svg.selectAll('.hexagon path').attr('stroke', 'black')
        })



      // chart.selectAll('circle')
      //   .data(points)
      //   .enter()
      //   .append('circle')
      //   .attr('cx', d => d[0])
      //   .attr('cy', d => d[1])
      //   .attr('r', 10)

      var height = chart.node().getBoundingClientRect().height;
      var width = chart.node().getBoundingClientRect().width;

      var heightProp = calc.chartHeight / height;
      var widthProp = calc.chartWidth / width;
      var maxProp = Math.max(heightProp, widthProp) + 0.4;
      hexGroup.attr('transform', `scale(${maxProp})`)



      var newHeight = chart.node().getBoundingClientRect().height;
      var newWidth = chart.node().getBoundingClientRect().width;


      var diffWidth = newWidth - calc.chartWidth - hexRadius * 4;
      var diffHeight = newHeight - height * 1.3

      d3.select('body').on('mousemove', function () {
        var coordinates = [0, 0];
        coordinates = d3.mouse(this);
        var x = coordinates[0];
        var y = coordinates[1];
        var newX = x / calc.chartWidth * diffWidth;
        var newY = y / calc.chartHeight * diffHeight
        slideGroup
          //     .transition().duration(100).ease(d3.easeLinear)
          .attr('transform', `translate(${-newX},${-newY})`)
      });

      // smoothly handle data updating
      updateData = function () {

      }
      //#########################################  UTIL FUNCS ##################################

      function findDivisors(n, result) {
        var sqrt = Math.sqrt(n);
        for (var i = 1; i <= sqrt; i++) {
          if ((n / i) % 1 == 0) {
            result.push({ a: i, b: n / i });
            result.push({ a: n / i, b: i });
          }
        }
        return result;
      }

      function debug() {
        if (attrs.isDebug) {
          //stringify func
          var stringified = scope + "";

          // parse variable names
          var groupVariables = stringified
            //match var x-xx= {};
            .match(/var\s+([\w])+\s*=\s*{\s*}/gi)
            //match xxx
            .map(d => d.match(/\s+\w*/gi).filter(s => s.trim()))
            //get xxx
            .map(v => v[0].trim())

          //assign local variables to the scope
          groupVariables.forEach(v => {
            main['P_' + v] = eval(v)
          })
        }
      }
      debug();
    });
  };

  //----------- PROTOTYEPE FUNCTIONS  ----------------------
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // pattern in action
    var selection = container.selectAll('.' + selector).data(data)
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection)
    selection.attr('class', selector);
    return selection;
  }

  //dinamic keys functions
  Object.keys(attrs).forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { return eval(` attrs['${key}'];`); }
      eval(string);
      return main;
    };
  });

  //set attrs as property
  main.attrs = attrs;

  //debugging visuals
  main.debug = function (isDebug) {
    attrs.isDebug = isDebug;
    if (isDebug) {
      if (!window.charts) window.charts = [];
      window.charts.push(main);
    }
    return main;
  }

  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }

  // run  visual
  main.run = function () {
    d3.selectAll(attrs.container).call(main);
    return main;
  }

  return main;
}
