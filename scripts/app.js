async function renderFirstChart() {
    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 30, bottom: 40, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    // Append the svg object to the body of the page
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Parse the Data
    d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals.csv").then(data => {
    
        // Convert IMDB Score to numeric
        data.forEach(d => {
            d["IMDB Score"] = +d["IMDB Score"];
        });
    
        // X axis: scale and draw
        const x = d3.scaleLinear()
            .domain([0, 10])     // Can be adjusted based on your data
            .range([0, width]);
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width)
            .attr("y", -6)
            .style("text-anchor", "end")
            .text("IMDB Score");
    
        // Set the parameters for the histogram
        const histogram = d3.histogram()
            .value(d => d["IMDB Score"])   // I'm using the value accessor
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(40)); // then the numbers of bins
    
        // And apply this function to data to get the bins
        const bins = histogram(data);
    
        // Y axis: scale and draw
        const y = d3.scaleLinear()
            .range([height, 0]);
        y.domain([0, d3.max(bins, d => d.length)]);   // d3.hist has to be called before the Y axis obviously
        svg.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "-3em")
            .style("text-anchor", "end")
            .text("Count");
    
        // Append the bar rectangles to the svg element
        svg.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)}, ${y(d.length)})`)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => height - y(d.length))
            .attr("class", "bar");
    });
}

// second slide

async function renderSecondChart() {
    const margin = 1;
    const width = 928;
    const height = width;
    const format = d3.format(",d");
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const data = await d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals.csv");

    // Filter data for movies with IMDB rating > 7.0
    const filteredData = data.filter(d => parseFloat(d["IMDB Score"]) > 7.0);

    // Aggregate data by genre
    const genreCounts = Array.from(d3.rollup(filteredData, v => v.length, d => d.Genre), ([id, value]) => ({id, value}));

    const pack = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(3);

    const root = pack(d3.hierarchy({children: genreCounts})
        .sum(d => d.value));

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    const node = svg.append("g")
        .selectAll()
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("title")
        .text(d => `${d.data.id}\n${format(d.value)}`);

    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.id))
        .attr("r", d => d.r);

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);

    text.append("tspan")
        .attr("x", 0)
        .attr("y", "0.35em")
        .attr("fill-opacity", 0.7)
        .text(d => d.data.id);

    text.append("tspan")
        .attr("x", 0)
        .attr("y", "1.35em")
        .attr("fill-opacity", 0.7)
        .text(d => format(d.value));

    document.getElementById("chart").appendChild(svg.node());
}


// third slide

async function renderThirdChart() {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 30, bottom: 40, left: 50},
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Set up the tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
    
    // Read the data and compute summary statistics for documentaries
    d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals.csv").then(function(data) {
    
      // Filter the data to only documentaries
      const parsedData = data
        .filter(d => d.Genre.includes("Documentary"))
        .map(d => ({
          title: d.Title,
          genre: d.Genre,
          score: +d["IMDB Score"]
        }));
    
      // Build and Show the Y scale
      var y = d3.scaleLinear()
        .domain([0,10])
        .range([height, 0]);
      svg.append("g").call(d3.axisLeft(y));
    
      // Build and Show the X scale
      var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(["Documentary"])
        .padding(0.05);     
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .style("text-anchor", "end");
    
      // Features of the histogram
      var histogram = d3.histogram()
            .domain(y.domain())
            .thresholds(y.ticks(20))    
            .value(d => d);
    
      // Compute the binning for documentaries
      var sumstat = d3.rollups(parsedData, function(d) {   
          input = d.map(g => g.score);    
          bins = histogram(input);   
          return(bins)
        }, d => d.genre);
    
      // What is the biggest number of value in a bin?
      var maxNum = 0;
      sumstat.forEach(d => {
        lengths = d[1].map(a => a.length);
        longuest = d3.max(lengths);
        if (longuest > maxNum) { maxNum = longuest }
      });
    
      // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
      var xNum = d3.scaleLinear()
        .range([0, x.bandwidth()])
        .domain([-maxNum,maxNum]);
    
      // Add the shape to this svg!
      svg.selectAll("myViolin")
        .data(sumstat)
        .enter()        
        .append("g")
          .attr("transform", d => "translate(" + x(d[0]) +" ,0)") 
        .append("path")
            .datum(d => d[1])
            .style("stroke", "none")
            .style("fill", "grey")
            .attr("d", d3.area()
                .x0(xNum(0))
                .x1(d => xNum(d.length))
                .y(d => y(d.x0))
                .curve(d3.curveCatmullRom));
    
      // Add individual points with jitter
      var jitterWidth = 20;
      svg.selectAll("indPoints")
        .data(parsedData)
        .enter()
        .append("circle")
          .attr("cx", d => x(d.genre) + x.bandwidth()/2 - Math.random()*jitterWidth)
          .attr("cy", d => y(d.score))
          .attr("r", 4)
          .style("fill", "blue")
          .attr("stroke", "white")
          .on("mouseover", function(event, d) {
            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            tooltip.html(`Title: ${d.title}<br/>IMDB Score: ${d.score}`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            tooltip.transition()
              .duration(500)
              .style("opacity", 0);
          });
    });
}
