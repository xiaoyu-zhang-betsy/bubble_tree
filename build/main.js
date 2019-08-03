function doIt(fileName1, fileName2 = null) {
    let svg1 = d3.select("#svgCircles1");

    d3.json(fileName1 + "?nocache=" + (new Date()).getTime(), function (error, data1) {
        data1.children.sort((a,b) => (a.name > b.name ? 1 : -1));
        drawChart(data1, svg1);
        
        if(fileName2) {
            let svg2 = d3.select("#svgCircles2");
            d3.json(fileName2 + "?nocache=" + (new Date()).getTime(), function (error, data2) {
                data2.children.sort((a,b) => (a.name > b.name ? 1 : -1));

                // put the element of data2 at the same position as in data
                children_modified = new Array(data2.children.length).fill(null);
                children_left = []
                data2.children.forEach(element => {
                    index = data1.children.findIndex(child => child.name == element.name)
                    if (index != -1 && index<data2.children.length)    
                        children_modified[index] = element;
                    else
                        children_left.push(element);
                });
                children_left.forEach(element => {
                    index = children_modified.findIndex(child => !child);
                    children_modified[index] = element;
                });
                data2.children = children_modified;

                drawChart(data2, svg2);
            });
        }
    });
}

function drawChart(data, svg) {
    // Create hierarchy.
    let root = d3.hierarchy(data)
        .sum(function(d) { return Math.sqrt(d.size) *10; }) // For flare.
        //.sum(function(d) { return d.size*3; })
        .sort(function(a, b) { return b.value - a.value; });

    // Create bubbletreemap.
    let bubbletreemap = d3.bubbletreemap()
        .padding(7)
        .curvature(10)
        .hierarchyRoot(root)
        .width(svg.attr("width"))
        .height(svg.attr("height"))
        .colormap(["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"]); // Color brewer: 12-class Paired

    // Do layout and coloring.
    let hierarchyRoot = bubbletreemap.doLayout().doColoring().hierarchyRoot();

    let leafNodes = hierarchyRoot.descendants().filter(function (candidate) {
        return !candidate.children;
    });

    // Draw contour.
    let contourGroup = svg.append("g")
        .attr("class", "contour");

    path = contourGroup.selectAll("path")
        .data(bubbletreemap.getContour())
        .enter().append("path")
        .attr("id", function(d) { return "c-" + d.name.substring(d.name.lastIndexOf("/")+1, d.name.length-1);})
        .attr("d", function(arc) { return arc.d; })
        .style("stroke", "black")
        .style("stroke-width", function(arc) { return arc.strokeWidth; })
        .style("fill-opacity", 0.0) 
        .style("fill", "white")
        .attr("transform", function(arc) {return arc.transform;})
        .on("mouseover", function(d) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.8) 
            .style("fill", "#b3b3b3");        
        })
        .on("mouseout", function(d) {
            // Use D3 to select element, change size
            d3.selectAll("#"+this.id)
            .style("fill-opacity", 0.0) 
            .style("fill", "white"); 
        });
        

    // Draw circles.
    let circleGroup = svg.append("g")
        .attr("class", "circlesAfterPlanck");

    circleGroup.selectAll("circle")
        .data(leafNodes)
        .enter().append("circle")
        .attr("r", function(d) { return d.r; })
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .style("fill", function(d) { return d.color; })
        //.style("fill-opacity", 0.7)
        .style("stroke", "black")
        .style("stroke-width", "3")
        .on("mouseover", function(d, i) {
            // Use D3 to select element, change size
            d3.select(this)
            //.attr("r", d.r*1.1)
            .style("fill", d3.rgb(d.color).brighter(0.5));
            
            labelText = d.data.name.substring(d.data.name.lastIndexOf("/")+1, d.data.name.length-1);
            // Specify where to put label of text
            circleGroup.append("rect")
                .attr("id", "r" + "-" + i)
                .attr("x", d.x+10)
                .attr("y", d.y-15)
                .attr("width", 12 * labelText.length)
                .attr("height", 30)
                .attr("cornerRadius", 3)
                .attr("fill", "white"); 

            circleGroup.append("text")
                .attr("id", "t" + "-" + i)
                .attr("x", d.x+20)
                .attr("y", d.y)
                .attr("dy", ".35em")
                .style("fill", "black")
                .text(labelText );                     
        })
        .on("mouseout", function(d, i) {
            // Use D3 to select element, change size
            d3.select(this)
            //.attr("r", d.r)
            .style("fill", d.color);
            // Select text by id and then remove
            d3.select("#t" + "-" + i).remove();  // Remove text location
            d3.select("#r" + "-" + i).remove();  // Remove text location
        });

    /*
    // Draw labels.
    let textGroup = svg.append("g")
        .attr("class", "text");

    textGroup.selectAll("text")
        .data(leafNodes)
        .enter().append("text")
        .attr("font-size", "12px")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(function(d) { return d.data.name; })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    */
}