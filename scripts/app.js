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
