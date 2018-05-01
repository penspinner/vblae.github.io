 /**
 * Created by Vblae on 11/25/16.
 */

function init() {
    var svg = d3.select(".svg")
        .attr("width", $(window).width())
        .attr("height", $(window).height() - 70);

    loadCSV("./csv/data.csv", function(csv) {
        start(parseCSV(csv), svg);
    });
}

function loadCSV(csvPath, onSuccess) {
    $.ajax({
        type : "GET",
        dataType : "text",
        url : "https://vblae.github.io/nbadata/" + csvPath,
        success : onSuccess
    });
}

function parseCSV(csv) {
    var rows = csv.split("\n"),
        columns =  rows.splice(0, 1)[0].split(",").filter(function(col) {
            return col != "";
        });

    var logs = rows.map(function(row) {
        var data = row.split(",").map(function(col) {
            return col.trim();
        });

        var log = {};
        for(var i = 0; i < columns.length; i++)
            log[columns[i]] = data[i];

        return log;
    });

    logs["columns"] = columns;
    return logs;
}


function start(data, svg) {
    var svgw = svg.attr("width"),
        svgh = svg .attr("height");

    var margins = {
        top : 10,
        bottom : 0,
        left : 5,
        right : 0
    };

    var rows = 2,
        cols = 2;

    var w = svgw / rows - margins.left - margins.right - 20,
        h = svgh / cols - margins.top - margins.bottom - 20;

    var constructors = [ScatterPlot, BarChart, ParallelCoordinates, PCA],
        names = ["scatter_plot", "bar_chart", "parallel_coordinates", "pca_plot"],
        offsets = [
            [margins.left, margins.top],
            [margins.left + svgw / 2, margins.top],
            [margins.left, margins.top + svgh / 2 ],
            [margins.left + svgw / 2, margins.top + svgh / 2 ]
        ];

    var displays = {};
    for(var i = 0; i < names.length; ++i){
        var plotgroup = svg.append("g")
            .attr("id", names[i])
            .attr("width", w)
            .attr("height", h)
            .attr("transform", "translate(" + offsets[i][0] + "," + offsets[i][1] + ")");

        displays[names[i]] = new constructors[i](data, plotgroup);
    }

    names.forEach(function(name) {
        displays[name].show();
    });
}


/*
 *
 * scatter plot
 *
 */
function ScatterPlot(data, svg) {
    // svg.append("rect")
    //     .attr("width", svg.attr("width"))
    //     .attr("height", svg.attr("height"))
    //     .style("stroke", "#ffffff");

    this.x = "FGP";
    this.y = "PTS";

    var xmap,
        xmin,
        xmax,
        xaxis,
        ymap,
        ymin,
        ymax,
        yaxis,
        points,
        circles;

    var w = svg.attr("width"),
        h = svg.attr("height");


    this.show = function() {
        this.calculate();
        this.plot();
    };

    this.calculate = function() {
        points = data.map((function(log) {
            return {
                x : parseFloat(log[this.x]),
                y : parseFloat(log[this.y])
            };
        }).bind(this));

        xmin = d3.min(points, function(point) { return point.x; });
        xmax = d3.max(points, function(point) { return point.x; });

        xmap = d3.scaleLinear()
            .domain([xmin, xmax]).nice()
            .range([35, w - 10]);

        xaxis = d3.axisBottom(xmap);

        ymin = d3.min(points, function(point) { return point.y; });
        ymax = d3.max(points, function(point) { return point.y; });

        ymap = d3.scaleLinear()
            .domain([ymin, ymax]).nice()
            .range([h - 30, 10]);

        yaxis = d3.axisLeft(ymap);
    };

    this.plot = function() {
        var self = this;
        circles = svg.selectAll(".point")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "point")
            .attr("transform", function(log) {
                var x = parseFloat(log[self.x]),
                    y = parseFloat(log[self.y]);
                return "translate(" + xmap(x) + "," + ymap(y) + ")";
            });

        circles.append("circle")
            .attr("r", 2)
            .attr("cx", 0)
            .attr("cy", 0)
            .style("fill", function(row) {
                if (row.highlight)
                    return "yellow";

                return "#db6464";
            });

        circles.on("mouseenter", function() {
            d3.select(this).select("circle")
                .attr("r", 4)
                .style("fill", "#00a9e5");
        });

        circles.on("mouseout", function() {
            d3.select(this).select("circle")
                .transition()
                .duration(200)
                .attr("r", 2)
                .style("fill", "#db6464");
        });

        svg.append("text").text(this.y)
            .attr("class", "axis-label y-label")
            .attr("opacity", 1)
            .attr("transform", "translate(10," + ((h - 40) / 2) + ") rotate(-90)");

        svg.append("text").text(this.x)
            .attr("class", "axis-label x-label")
            .attr("opacity", 1)
            .attr("transform", "translate(" + ((w - 45) / 2) + "," + (h) + ")");

        svg.append("g")
            .attr("class", "orange-axis xaxis")
            .attr("transform", "translate(0," + (h - 30) + ")")
            .call(xaxis);

        svg.append("g")
            .attr("class", "orange-axis yaxis")
            .attr("transform", "translate(35,0)")
            .call(yaxis);

        var displayType,
            showingMenuX = false,
            showingMenuY = false;
        d3.select(".x-drop").on("click", function() {
            if(showingMenuX) {
                displayType = "none";
                showingMenuX = false;
            }else {
                displayType = "block";
                showingMenuX = true;
            }
            d3.select("#x-dropdown")
                .style("display", displayType);
        });

        d3.select(".y-drop").on("click", function() {
            if(showingMenuY) {
                displayType = "none";
                showingMenuY = false;
            }else {
                displayType = "block";
                showingMenuY = true;
            }
            d3.select("#y-dropdown")
                .style("display", displayType);
        });

        d3.selectAll(".x-option").on("click", function() {
            self.transition(d3.select(this).text(), undefined);
        });

        d3.selectAll(".y-option").on("click", function() {
            self.transition(undefined, d3.select(this).text());
        });

    };

    this.transition = function(x, y) {
        if(x) this.x = x;
        if(y) this.y = y;

        this.calculate();
        var self = this;
        circles.transition()
            .duration(400)
            .ease(d3.easeBackInOut)
            .attr("transform", function(log) {
                var x = parseFloat(log[self.x]),
                    y = parseFloat(log[self.y]);
                return "translate(" + xmap(x) + "," + ymap(y) + ")";
            });

        if(x) svg.select(".x-label")
            .transition()
            .duration(400)
            .ease(d3.easeBackIn)
            .attr("opacity", 0)
            .attr("transform", "translate(0," + (h - 5) + ") rotate(-90)")
            .on("end", function() {
                svg.select(".x-label")
                    .text(self.x)
                    .attr("transform", "translate(" + w + "," + (h) + ") rotate(-90)")
                    .transition()
                    .duration(400)
                    .ease(d3.easeBackOut)
                    .attr("opacity", 1)
                    .attr("transform", "translate(" + ((w - 45) / 2) + "," + (h) + ")");
            });

        if(y) svg.select(".y-label")
            .transition()
            .duration(400)
            .ease(d3.easeBackIn)
            .attr("opacity", 0)
            .attr("transform", "translate(10," + h + ") rotate(-180)")
            .on("end", function(){
                svg.select(".y-label")
                    .text(self.y)
                    .attr("transform", "translate(10,0) rotate(-180)")
                    .transition()
                    .duration(400)
                    .ease(d3.easeBackOut)
                    .attr("opacity", 1)
                    .attr("transform", "translate(10," + ((h - 40) / 2) + ") rotate(-90)");
            });

        if(x) svg.select(".xaxis")
            .transition()
            .duration(500)
            .call(xaxis);

        if(y) svg.select(".yaxis")
            .transition()
            .duration(500)
            .call(yaxis);
    }
}

/*
 *
 * bar chart
 *
 */
function BarChart(data, svg) {
    // svg.append("rect")
    //     .attr("width", svg.attr("width"))
    //     .attr("height", svg.attr("height"))
    //     .style("stroke", "#ffffff");
    this.x = "AST";
    var xmap,
        xmin,
        xmax,
        xaxis,
        ymap,
        ymin,
        ymax,
        yaxis,
        bars,
        bins,
        binw,
        dataset;

    var self = this;
    var w = svg.attr("width"),
        h = svg.attr("height"),
        ticks = 15,
        format = d3.format(",.0f");

    var cliked,
        active;

    function applyhovers() {
        bars.on("click", function(bin) {
            if(cliked[bin.name]){
                delete cliked[bin.name];
                active = active.filter(function(a) {
                    return a != bin.name;
                });
            } else{
                cliked[bin.name] = bin;
                active.push(bin.name);

                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("transform", function(bin) {
                        return "translate(" + (xmap(bin.x0) + 1) + "," + (ymap(bin.length) - 15) + ")";
                    });

                d3.select(this).select("rect")
                    .transition()
                    .duration(200)
                    .attr("x", 0)
                    .attr("width", binw + 8)
                    .style("fill", "#00a9e5")
                    .attr("height", function(bin) {
                        return h - ymap(bin.length) - 15;
                    });

                d3.select(this).select("text")
                    .attr("opacity", 1);
            }


            if(active.length > 0) d3.selectAll(".point")
                .style("display", function(row) {
                    return active.some(function(a) {
                        return row[self.x] >= cliked[a].x0 && row[self.x] < cliked[a].x1;
                    }) ? null : "none";
                })
                .select("circle").style("fill", function(row) {
                    if (row.highlight)
                        return "yellow";

                    return "#db6464";
                });
            else
                d3.selectAll(".point")
                    .style("display", null)
                    .select("circle").style("fill", function(row) {
                        if (row.highlight)
                            return "yellow";

                        return "#db6464";
                    });
        });


        bars.on("mouseenter", function(bin) {
            if(cliked[bin.name]) return;

            d3.select(this)
                .transition()
                .duration(200)
                .attr("transform", function(bin) {
                    return "translate(" + (xmap(bin.x0) + 1) + "," + (ymap(bin.length) - 15) + ")";
                });

            d3.select(this).select("rect")
                .transition()
                .duration(200)
                .attr("x", 0)
                .attr("width", binw + 8)
                .style("fill", "#00a9e5")
                .attr("height", function(bin) {
                    return h - ymap(bin.length) - 15;
                });

            d3.select(this).select("text")
                .attr("opacity", 1);

            d3.selectAll(".point")
                .each(function(row) {
                    if(row[self.x] >= bin.x0 && row[self.x] < bin.x1)
                        d3.select(this).style("display", null)
                            .select("circle").style("fill", "#00a9e5");
                });

        });

        bars.on("mouseout", function(bin) {
            if(cliked[bin.name]) return;

            d3.select(this)
                .transition()
                .duration(400)
                .attr("transform", function(bin) {
                    return "translate(" + (xmap(bin.x0) + 1) + "," + ymap(bin.length) + ")";
                });

            d3.select(this).select("rect")
                .transition()
                .duration(400)
                .attr("x", 5)
                .attr("width", binw)
                .style("fill", "#db6464")
                .attr("height", function(bin) {
                    return h - ymap(bin.length) - 30;
                });

            d3.select(this).select("text")
                .attr("opacity", 0);

            if(active.length > 0) d3.selectAll(".point")
                .style("display", function(row) {
                    return active.some(function(a) {
                        return row[self.x] >= cliked[a].x0 && row[self.x] < cliked[a].x1;
                    }) ? null : "none";
                });
            else
                d3.selectAll(".point")
                    .style("display", null)
                    .select("circle").style("fill", function(row) {
                        if (row.highlight)
                            return "yellow";

                        return "#db6464";
                    });
        });
    }

    function ampbars() {
        d3.selectAll(".bar").remove();

        this.calculate();
        d3.select(".bar-xaxis")
            .transition()
            .duration(800)
            .call(xaxis);

        d3.select(".bar-yaxis")
            .transition()
            .duration(800)
            .call(yaxis);

        bars = svg.selectAll(".bar")
            .data(bins)
            .enter()
            .append("g")
            .attr("class", "bar")
            .attr("transform", function(bin) {
                return "translate(" + (xmap(bin.x0) + 1) + "," + (h - 30) + ")";
            });

        bars.append("text")
            .attr("class", "hover-text")
            .attr("dy", "-.75em")
            .attr("y", 6)
            .attr("x", (binw + 8) / 2)
            .attr("text-anchor", "middle")
            .attr("opacity", 0)
            .text(function(bin) {
                return format(bin.length);
            });

        // pause for 2/10 of a second
        svg.transition()
            .duration(200)
            .on("end", function() {
                bars.append("rect")
                    .style("fill", "#db6464")
                    .attr("x", 5)
                    .attr("width", binw)
                    .attr("height", 0);

                bars.transition()
                    .duration(800)
                    .ease(d3.easeBackOut)
                    .attr("transform", function(bin) {
                        return "translate(" + (xmap(bin.x0) + 1) + "," + ymap(bin.length) + ")";
                    });

                var n = bins.length;
                bars.select("rect")
                    .transition()
                    .duration(800)
                    .ease(d3.easeBackOut)
                    .attr("height", function(bin) {
                        return h - ymap(bin.length) - 30;
                    })
                    .on("end", function() {
                        if(--n == 0)
                            applyhovers();
                    });
            });
    }

    this.show = function() {
        this.calculate();
        this.plot();
    };

    this.calculate = function() {
        dataset = data.map((function(log) {
            return parseFloat(log[this.x]);
        }).bind(this));

        xmin = 0;
        xmax = d3.max(dataset, function(stat) { return stat; });

        xmap = d3.scaleLinear()
            .domain([xmin, xmax]).nice()
            .range([35, w - 10]);

        xaxis = d3.axisBottom(xmap).ticks(ticks);

        bins = d3.histogram()
            .domain(xmap.domain())
            .thresholds(ticks)(dataset);

        bins.forEach(function(bin, i){
            bin.name = "n" + i;
        });

        binw = xmap(bins[0].x1) - xmap(bins[0].x0) - 10;

        ymin = 0;
        ymax = d3.max(bins, function(bin) { return bin.length; });

        ymap = d3.scaleLinear()
            .domain([ymin, ymax]).nice()
            .range([h - 30, 10]);

        yaxis = d3.axisLeft(ymap);

        cliked = {};
        active = [];
    };

    this.plot = function() {
        var self = this;

        bars = svg.selectAll(".bar")
            .data(bins)
            .enter()
            .append("g")
            .attr("class", "bar")
            .attr("transform", function(bin) {
                return "translate(" + (xmap(bin.x0) + 1) + "," + ymap(bin.length) + ")";
            });

        bars.append("text")
            .attr("class", "hover-text")
            .attr("dy", "-.75em")
            .attr("y", 6)
            .attr("x", (binw + 8) / 2)
            .attr("text-anchor", "middle")
            .attr("opacity", 0)
            .text(function(bin) {
                return format(bin.length);
            });

        bars.append("rect")
            .style("fill", "#db6464")
            .attr("x", 5)
            .attr("width", binw)
            .attr("height", function(bin) {
                return h - ymap(bin.length) - 30;
            });

        applyhovers();

        svg.append("text").text("OCCURRENCES")
            .attr("class", "axis-label bar-y-label")
            .attr("opacity", 1)
            .attr("transform", "translate(0," + ((h - 40) / 2) + ") rotate(-90)");

        svg.append("text").text(this.x)
            .attr("class", "axis-label bar-x-label")
            .attr("opacity", 1)
            .attr("transform", "translate(" + ((w - 45) / 2) + "," + (h) + ")");

        svg.append("g")
            .attr("class", "orange-axis bar-xaxis")
            .attr("transform", "translate(0," + (h - 30) + ")")
            .call(xaxis);

        svg.append("g")
            .attr("class", "orange-axis bar-yaxis")
            .attr("transform", "translate(35,0)")
            .call(yaxis);

        var displayType,
            showingMenu = false;
        d3.select(".bar-drop").on("click", function() {
            if(showingMenu) {
                displayType = "none";
                showingMenu = false;
            }else {
                displayType = "block";
                showingMenu = true;
            }

            d3.select("#bar-dropdown")
                .style("display", displayType);


        });

        d3.selectAll(".bar-option").on("click", function() {
            self.transition(d3.select(this).text());
        });
    };

    this.transition = function(x) {
        if(!x) return;

        this.x = x;
        bars.on("mouseenter", undefined)
            .on("mouseout", undefined)
            .on("click", undefined)
            .transition()
            .duration(800)
            .ease(d3.easeBounceOut)
            .attr("transform", function(bin) {
                return "translate(" + this.transform.baseVal["0"].matrix.e + "," + (h - 30) + ")";
            });

        d3.selectAll(".point")
            .style("display", null)
            .select("circle").style("fill", function(row) {
            if (row.highlight)
                return "yellow";

            return "#db6464";
        });

        var n = bins.length;
        var self = this;
        bars.select("rect")
            .transition()
            .duration(800)
            .ease(d3.easeBounceOut)
            .attr("height", 0)
            .on("end", function() {
                if(--n == 0){
                    ampbars.bind(self).call();
                }
            });

        svg.select(".bar-x-label")
            .transition()
            .duration(600)
            .ease(d3.easeBackIn)
            .attr("opacity", 0)
            .attr("transform", "translate(0," + (h - 5) + ") rotate(-90)")
            .on("end", function() {
                svg.select(".bar-x-label")
                    .text(self.x)
                    .attr("transform", "translate(" + w + "," + (h) + ") rotate(-90)")
                    .transition()
                    .duration(800)
                    .ease(d3.easeBackOut)
                    .attr("opacity", 1)
                    .attr("transform", "translate(" + ((w - 45) / 2) + "," + (h) + ")");
            });
    };
}

/*
 *
 * parallel coordinates
 *
 */
function ParallelCoordinates(data, svg) {
    // svg.append("rect")
    //     .attr("width", svg.attr("width"))
    //     .attr("height", svg.attr("height"))
    //     .style("stroke", "#ffffff");

    var xmap,
        ymap,
        cols,
        axes,
        lines,
        yaxes,
        active,
        actives,
        dragging;

    var w = svg.attr("width"),
        h = svg.attr("height");

    function makepath(row) {
        var linegen = d3.line();
        return linegen(cols.map(function(colname) {
            return [position(colname), ymap[colname](row[colname])];
        }));
    }

    function position(colname) {
        var v = dragging[colname];
        return v == null ? xmap(colname) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this)
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        var selection = d3.event.selection;
        var id = d3.select(this).attr("id");
        if(active[id] && selection[1] - selection[0] <= 0)
            delete active[id];
    }

    function brush() {
        d3.select(this)
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);

        var selection = d3.event.selection;
        if(selection[1] - selection[0] <= 0)
            delete active[d3.select(this).attr("id)")];
        active[d3.select(this).attr("id")] = d3.event.selection;
        actives = cols.filter(function(colname) {
            return active[colname] && active[colname][1] - active[colname][0] > 0;
        });

        if(actives.length > 0) lines.style("display", function(row) {
            return actives.every(function(colname, i) {
                var val = ymap[colname](row[colname]);
                return active[colname][0] <= val && val <= active[colname][1];
            }) ? null : "none";
        });
        else{
            d3.selectAll(".point")
                .select("circle")
                .each(function(row) {
                    row.highlight = false;
                });
            lines.style("display", null);
        }

        d3.selectAll(".point")
            .select("circle")
            .style("fill", function(row){
                if(row.highlight)
                    return "yellow";

                return "#db6464";
            });
    }

    function brushend() {
        actives = cols.filter(function(colname) {
            return active[colname] && active[colname][1] - active[colname][0] > 0;
        });

        if(actives.length > 0) lines.style("display", function(row) {
            return actives.every(function(colname) {
                var val = ymap[colname](row[colname]);
                return active[colname][0] <= val && val <= active[colname][1];
            }) ? highlight(row) : unhighlight(row);
        });
        else{
            d3.selectAll(".point")
                .select("circle")
                .each(function(row) {
                    row.highlight = false;
                });
            lines.style("display", null);
        }


        d3.selectAll(".point")
            .select("circle")
            .style("fill", function(row){
                if(row.highlight)
                    return "yellow";

                return "#db6464";
            });

    }

    function highlight(row) {
        row.highlight = true;
        return null;
    }

    function unhighlight(row) {
        row.highlight = false;
        return "none";
    }

    this.show = function() {
        this.calculate();
        this.plot();
    };

    this.calculate = function() {
        cols = data.columns.filter(function(colname) {
            return colname == "PTS" || colname == "FGM" || colname == "FGP" || colname == "AST" || colname == "3PM";
        });

        xmap = d3.scalePoint()
            .domain(cols)
            .range([35, w - 10]);

        ymap = {};
        yaxes = {};
        active = {};
        actives = [];
        dragging = {};
        cols.forEach(function(col) {
            var domain = d3.extent(data, function(row) {
                return parseFloat(row[col]);
            });

            ymap[col] = d3.scaleLinear()
                .domain(domain).nice()
                .range([h - 10, 30]);

            ymap[col].brush = d3.brushY()
                .on("start", brushstart)
                .on("brush", brush)
                .on("end", brushend);

            yaxes[col] = d3.axisLeft(ymap[col]);
        });
    };

    this.plot = function() {
        lines = svg.append("g")
            .attr("class", "lines")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", makepath)
            .style("stroke-width", "1px")
            .attr("stroke", function(row) {
                if(row["W/L"] == "W")
                    return "rgba(219,100,100, 0.4)";

                return "rgba(0, 169, 229, 0.4)";
            });

        axes = svg.selectAll(".place")
            .data(cols)
            .enter()
            .append("g")
            .attr("class", "place")
            .attr("transform", function(colname) {
                return "translate(" + xmap(colname) + ")";
            })
            .call(d3.drag()
                .on("start", function(colname) {
                    dragging[colname] = xmap(colname);
                })
                .on("drag", function(colname) {
                    dragging[colname] = Math.min(w, Math.max(10, d3.event.x));
                    lines.attr("d", makepath);

                    cols.sort(function (col1, col2) {
                       return position(col1) - position(col2);
                    });
                    xmap.domain(cols);

                    axes.attr("transform", function(colname) {
                        return "translate(" + position(colname) +  ")";
                    });
                })
                .on("end", function(colname) {
                    delete dragging[colname];
                    transition(d3.select(this).attr("transform", "translate(" + xmap(colname) + ")" ));
                    transition(lines).attr("d", makepath);
                }));

        axes.append("g")
            .attr("class","white-axis")
            .each(function(colname) {
                d3.select(this).call(yaxes[colname]);

            });

        axes.append("g")
            .attr("class", "brush")
            .each(function(colname) {
                d3.select(this)
                    .attr("id", colname)
                    .call(ymap[colname].brush)
            });

        axes.selectAll("brush").selectAll("rect")
            .attr("x", -8)
            .attr("width", 18)


        axes.append("text")
            .attr("y", 4)
            .attr("class", "axis-label")
            .text(function(d) { return d; });


        lines.on("mouseenter", function(row) {
            d3.select(this)
                .attr("stroke", "#63B973")
                .style("stroke-width", "4px");
        });

        lines.on("mouseout", function(row) {
            d3.select(this)
                .style("stroke-width", "1px")
                .attr("stroke", row["W/L"] == "W" ? "rgba(219,100,100, 0.4)" : "rgba(0, 169, 229, 0.4)");
        });
    };

}

/*
 *
 * PCA 
 * 
 */
 function PCA(data, svg) {
     // svg.append("rect")
     //     .attr("width", svg.attr("width"))
     //     .attr("height", svg.attr("height"))
     //     .style("stroke", "#ffffff");

     var xmap,
         ymap,
         xaxis,
         yaxis,
         points,
         xscreenmap,
         yscreenmap;

     var w = svg.attr("width"),
         h = svg.attr("height");

    this.show = function() {
        this.calculate();
        this.plot();
     };

     this.calculate = function() {
        xmap = d3.scaleLinear()
            .domain(d3.extent(data, function(row) {
                return parseFloat(row["x"]);
            }))
            .range([10, w - 30]);

         xscreenmap = d3.scaleLinear()
             .domain([-1, 1])
             .range([10, w - 30]);

         xaxis = d3.axisBottom(xscreenmap);

         ymap = d3.scaleLinear()
             .domain(d3.extent(data, function(row) {
                 return parseFloat(row["y"]);
             }))
             .range([h - 30, 10]);

         yscreenmap = d3.scaleLinear()
             .domain([-1, 1])
             .range([h - 30, 10]);

         console.log(w, h, xscreenmap.range(), yscreenmap.range());

         yaxis = d3.axisLeft(yscreenmap);
     };

     this.plot = function() {
        points = svg.selectAll(".point")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "point")
            .attr("transform", function(row) {
                return "translate(" + xmap(row["x"]) + "," + ymap(row["y"]) + ")";
            });

         points.append("circle")
             .attr("r", 2)
             .attr("cx", 0)
             .attr("cy", 0)
             .style("fill", function(row) {
                 if (row.highlight)
                     return "yellow";

                 return "#db6464";
             });

         points.on("mouseenter", function() {
             d3.select(this).select("circle")
                 .attr("r", 4)
                 .style("fill", "#00a9e5");
         });

         points.on("mouseout", function() {
             d3.select(this).select("circle")
                 .transition()
                 .duration(200)
                 .attr("r", 2)
                 .style("fill", "#db6464");
         });

         svg.append("text").text("PCA 2")
             .attr("class", "axis-label y-label")
             .attr("opacity", 1)
             .attr("transform", "translate(10," + ((h - 80) / 2) + ")");

         svg.append("text").text("PCA 1")
             .attr("class", "axis-label x-label")
             .attr("opacity", 1)
             .attr("transform", "translate(" + ((w - 45) / 2) + "," + (h) + ")");

         svg.append("g")
             .attr("class", "white-axis pca-y-axis")
             .attr("transform", "translate(" + ((w - 30) / 2 + 5) + ",0)")
             .call(yaxis);


         svg.append("g")
             .attr("class", "white-axis pca-x-axis")
             .attr("transform", "translate(0," + ((h - 30) / 2 + 5) + ")")
             .call(xaxis);

     }
 }
