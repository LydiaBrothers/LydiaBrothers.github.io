async function renderFirstChart() {
  // Set the dimensions and margins of the graph
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

  // Append the svg object to the body of the
  const container = d3.select("#chart-container");
  const containerWidth = container.node().getBoundingClientRect().width;
  const width = containerWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom; // Set the height as desired
  const svg = container.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up the tooltip
  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // Parse the Data
  const data = await d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals_augment.csv");

  // Convert IMDB Score to numeric
  data.forEach(d => {
      d["IMDB Score"] = +d["IMDB Score"];
  });

  // Get the unique genres and count their occurrences
  const genreCounts = d3.rollups(data, v => v.length, d => d["Simplified Genre"])
      .sort((a, b) => b[1] - a[1]); // Sort by prevalence
  const genres = genreCounts.map(d => d[0]);
  genres.unshift("All");

  // Create a dropdown
  const dropdown = d3.select("#dropdown-container")
      .append("select")
      .attr("id", "genreDropdown")
      .on("change", updateChart);

  dropdown.selectAll("option")
      .data(genres)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

  // Set up the scales and axes
  const x = d3.scaleLinear()
      .domain([0, 10]) // Adjust based on the entire data
      .range([0, width]);

  const histogram = d3.histogram()
      .value(d => d["IMDB Score"]) // I'm using the value accessor
      .domain(x.domain()) // then the domain of the graphic
      .thresholds(x.ticks(40)); // then the numbers of bins

  // Calculate the bins for all data to set y-axis domain
  const allBins = histogram(data);

  const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(allBins, d => d.length)]);

  svg.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("class", "axis-label")
      .attr("x", width)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("IMDB Score");

  const yAxis = svg.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(y));

  yAxis.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "-3em")
      .style("text-anchor", "end")
      .text("Count");

  // Define color scale based on IMDB Score
  const color = d3.scaleLinear()
      .domain([d3.min(data, d => d["IMDB Score"]), d3.max(data, d => d["IMDB Score"])])
      .range(["red", "blue"]);

  // Initial render
  updateChart();

  function updateChart() {
      const selectedGenre = dropdown.node().value;

      // Filter data based on selected genre
      const filteredData = selectedGenre === "All" ? data : data.filter(d => d["Simplified Genre"] === selectedGenre);

      // Apply the histogram function to filtered data to get the bins
      const bins = histogram(filteredData);

      // Calculate the median IMDB score
      const medianIMDB = d3.median(filteredData, d => d["IMDB Score"]);

      // Data join
      const u = svg.selectAll("rect")
          .data(bins);

      // Update existing bars
      u.transition()
          .duration(1000)
          .attr("x", d => x(d.x0))
          .attr("y", d => y(d.length))
          .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
          .attr("height", d => height - y(d.length))
          .attr("fill", d => color((d.x0 + d.x1) / 2)); // Use the average of x0 and x1 for coloring

      // Enter new bars
      u.enter()
          .append("rect")
          .attr("x", d => x(d.x0))
          .attr("y", y(0))
          .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
          .attr("height", 0)
          .attr("fill", d => color((d.x0 + d.x1) / 2)) // Use the average of x0 and x1 for coloring
          .merge(u)
          .transition()
          .duration(1000)
          .attr("x", d => x(d.x0))
          .attr("y", d => y(d.length))
          .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
          .attr("height", d => height - y(d.length));

      // Remove old bars
      u.exit()
          .transition()
          .duration(1000)
          .attr("y", y(0))
          .attr("height", 0)
          .remove();

      // Tooltip interactions
      svg.selectAll("rect")
          .on("mouseover", function(event, d) {
              tooltip.transition()
                  .duration(200)
                  .style("opacity", .9);
              tooltip.html(`Count: ${d.length}<br/>Range: ${d.x0.toFixed(1)} - ${d.x1.toFixed(1)}`)
                  .style("left", (event.pageX + 5) + "px")
                  .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
              tooltip.transition()
                  .duration(500)
                  .style("opacity", 0);
          });

      // Annotate the median value
      annotateMedian(medianIMDB, selectedGenre);
  }
  
  function annotateMedian(median, genre) {
      const annotation = [
          {
              note: {
                  label: `${capitalizeFirstLetter(genre)} - The median value of the IMDB score is ${median.toFixed(2)}`,
                  title: "Median IMDB Score",
                  wrap: 200,
                  align: "middle",
              },
              x: x(median),
              y: y.range()[0],
              dy: -350,
              dx: 0,
              subject: { radius: 10 },
              type: d3.annotationCalloutCircle,
          },
      ];

      const makeAnnotations = d3.annotation()
          .type(d3.annotationLabel)
          .annotations(annotation);

      svg.selectAll(".annotation-group").remove(); // Clear previous annotations
      const annotationGroup = svg.append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations);

      // Style the annotation text
      annotationGroup.selectAll(".annotation text")
          .style("fill", "white") // Change text color to white
          .style("font-family", "Arial") // Set font to Arial
          .style("font-size", "16px"); // Set font size to larger
  }
}


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// second slide
async function renderSecondChart() {
  const margin = 1;
  const format = d3.format(",d");
  const color = d3.scaleOrdinal(Array.from({ length: 15 }, (_, i) => d3.interpolateRainbow(i / 15)));
  const container = d3.select("#chart-container");
  const containerWidth = container.node().getBoundingClientRect().width;
  const width = containerWidth;
  const height = 1000; // Set the height as desired

  const data = await d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals_augment.csv");

  // Set fixed range for the slider
  const minYear = 2015;
  const maxYear = 2021;

  // Create a slider for year selection
  const sliderContainer = container.append("div")
      .attr("id", "slider-container");

  sliderContainer.append("label")
      .text("Good Productions premiered between 2014 and... ");

  const slider = sliderContainer.append("input")
      .attr("type", "range")
      .attr("min", minYear)
      .attr("max", maxYear)
      .attr("value", minYear)
      .attr("step", 1)
      .on("input", updateChart);

  const yearLabel = sliderContainer.append("span")
      .text(minYear);

  // Initial filter for movies with IMDB rating > 7.0
  let filteredData = data.filter(d => parseFloat(d["IMDB Score"]) > 7.0);

  const pack = d3.pack()
      .size([width - margin * 2, height - margin * 2])
      .padding(3);

  const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("text-anchor", "middle");

  // Create a tooltip
  const tooltip = container.append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "5px")
      .style("pointer-events", "none");

  // Stores the counts from the previous year
  let previousCounts = { "Documentary": 0, "Drama": 0, "Comedy": 0 };

  function updateChart() {
      // Update the year label
      yearLabel.text(slider.node().value);

      // Get the selected year
      const selectedYear = +slider.node().value;

      // Filter data to include all years up to and including the selected year
      const yearFilteredData = filteredData.filter(d => +d["Premiere Year"] <= selectedYear);

      // Aggregate data by genre
      const genreCounts = Array.from(d3.rollup(yearFilteredData, v => v.length, d => d["Simplified Genre"]), ([id, value]) => ({ id, value }));

      // Create the root node for the bubble pack layout
      const root = pack(d3.hierarchy({ children: genreCounts }).sum(d => d.value));

      // Clear existing SVG content
      svg.selectAll("*").remove();

      const node = svg.append("g")
          .attr("transform", `translate(${margin},${margin})`)
          .selectAll()
          .data(root.leaves())
          .join("g")
          .attr("transform", d => `translate(${d.x},${d.y})`);

      node.append("title")
          .text(d => `${d.data.id}\n${format(d.value)}`);

      node.append("circle")
          .attr("fill-opacity", 0.7)
          .attr("fill", d => color(d.data.id))
          .attr("r", d => d.r)
          .on("mouseover", function (event, d) {
              tooltip.transition().duration(200).style("opacity", 0.9);
              tooltip.html(`${d.data.id}: ${format(d.value)}`)
                  .style("left", (event.pageX + 5) + "px")
                  .style("top", (event.pageY - 28) + "px");
          })
          .on("mousemove", function (event) {
              tooltip.style("left", (event.pageX + 5) + "px")
                  .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function () {
              tooltip.transition().duration(500).style("opacity", 0);
          });

      const text = node.append("text")
          .attr("clip-path", d => `circle(${d.r})`)
          .style("fill", "white") // Set text color to white
          .style("font-weight", "bold") // Set text to bold
          .style("font-size", "14px") // Set font size
          .style("text-anchor", "middle"); // Center the text

      text.append("tspan")
          .attr("x", 0)
          .attr("y", "0.35em")
          .text(d => d.data.id);

      text.append("tspan")
          .attr("x", 0)
          .attr("y", "1.35em")
          .text(d => format(d.value));

      // Annotate the changes in Documentary, Drama, and Comedy
      annotateChanges(root, previousCounts);

      // Update previous counts
      previousCounts = genreCounts.reduce((acc, { id, value }) => ({ ...acc, [id]: value }), previousCounts);
  }

  function annotateChanges(root, previousCounts) {
      const genresToAnnotate = ["documentary", "drama", "comedy"];
      const changes = genresToAnnotate.map(genre => {
          const currentCount = root.leaves().find(d => d.data.id === genre)?.value || 0;
          const previousCount = previousCounts[genre] || 0;
          return { genre, change: currentCount - previousCount, currentCount };
      });

      const annotations = changes.map(({ genre, change }) => {
          const bubble = root.leaves().find(d => d.data.id === genre);
          if (!bubble) return null;

          return {
              note: {
                  label: `${capitalizeFirstLetter(genre)}: ${change >= 0 ? "+" : ""}${change}`,
                  title: `Difference from Prior Selection`,
                  wrap: 200,
                  align: "middle",
              },
              x: bubble.x + margin,
              y: bubble.y + margin,
              dy: 30, // Adjust as necessary
              dx: 40, // Adjust as necessary
              subject: { // Set the subject as a line without a circle
                  type: 'line',
                  x1: 0,
                  y1: 0,
                  x2: 0,
                  y2: 0,
              },
              type: d3.annotationCallout, // Use callout instead of calloutCircle
          };
      }).filter(Boolean);

      const makeAnnotations = d3.annotation()
          .type(d3.annotationLabel)
          .annotations(annotations);

      svg.selectAll(".annotation-group").remove(); // Clear previous annotations
      const annotationGroup = svg.append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations);

      // Style the annotation text
      annotationGroup.selectAll(".annotation text")
          .style("fill", "white") // Change text color to white
          .style("font-family", "Arial") // Set font to Arial
          .style("font-size", "16px"); // Set font size to larger

      // Style the annotation lines to be white
      annotationGroup.selectAll(".annotation subject line")
          .style("stroke", "white") // Set line color to white
          .style("stroke-width", 2); // Set the line width as needed
  }

  // Initial render
  updateChart();
}



// third slide

async function renderThirdChart() {
  // Set the dimensions and margins of the graph
  var margin = { top: 10, right: 30, bottom: 30, left: 40 },
      container = d3.select("#chart-container"),
      containerWidth = container.node().getBoundingClientRect().width,
      width = containerWidth - margin.left - margin.right,
      height = 1000 - margin.top - margin.bottom;

  // Append the SVG object to the body of the page
  var svg = d3.select("#chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Set up the tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Read the data and compute summary statistics for premiere years
  d3.csv("https://LydiaBrothers.github.io/data/NetflixOriginals_augment.csv").then(function(data) {

    // Parse the data and filter to include only entries with a premiere year
    const parsedData = data
      .filter(d => d["IMDB Score"] && d["Premiere Year"])
      .map(d => ({
        title: d.Title,
        premiereYear: +d["Premiere Year"],  // Convert to number
        score: +d["IMDB Score"],
        language: d.Language,  // Add language
        genre: d.Genre,        // Add genre
        runtime: d.Runtime      // Add runtime
      }));

    // Define the years you want to include and order them
    const orderedYears = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];

    // Build and Show the Y scale
    var y = d3.scaleLinear()
      .domain([0, 10]) // Ensure the Y scale is appropriate
      .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Build and Show the X scale using ordered premiere years
    var x = d3.scaleBand()
      .range([0, width])
      .domain(orderedYears)
      .padding(0.05);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Features of the histogram
    var histogram = d3.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(20))
          .value(d => d);

    // Compute the binning for premiere years
    var sumstat = d3.rollups(parsedData, function(d) {
        const input = d.map(g => g.score);
        const bins = histogram(input);
        return bins;
      }, d => d.premiereYear);

    // Find the maximum number of values in a bin using a loop
    var maxNum = 0;
    for (const d of sumstat) {
      const lengths = d[1].map(a => a.length);
      const longest = d3.max(lengths);
      if (longest > maxNum) { maxNum = longest; }
    }

    // The maximum width of a violin must be x.bandwidth
    var xNum = d3.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum, maxNum]);

    // Add the shape to this svg
    svg.selectAll("myViolin")
      .data(sumstat)
      .enter()
      .append("g")
        .attr("transform", d => "translate(" + x(d[0]) + " ,0)")
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
        .attr("cx", d => x(d.premiereYear) + x.bandwidth() / 2 - Math.random() * jitterWidth)
        .attr("cy", d => y(d.score))
        .attr("r", 5)
        .style("fill", d => {
          // Replace this with a fixed color or a simple scale based on the score
          if (d.score < 5) return "red";       // Low score
          else if (d.score < 7) return "#FFA93B"; // Medium score
          else return "green";                   // High score
        })
        .attr("stroke", "black")
        .on("mouseover", function(event, d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9);
          tooltip.html(`Title: ${d.title}<br/>IMDB Score: ${d.score}<br/>Language: ${d.language}<br/>Genre: ${d.genre}<br/>Runtime (mins) : ${d.runtime}`)
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
