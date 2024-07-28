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
