let x, y;
let n_bins;
let sims = [];
let domain = [0,0];
let max_prob = 1;
let h_ref;

let summa = 0;
let mean = 0;

let margin = { top: 20, right: 20, bottom: 20, left: 30 }
let width, height;

let svg, axis;
let name_text, iter_text, mean_line, mean_text;
let stats = false;
let qs, q_lines, q_texts, q_texts1, q_texts2;
let mouse = false;
let m_line, m_text;
let h_lines;

window.addEventListener("load", (e) => {
  const query = window.location.search;
  const params = new URLSearchParams(query);
  nbins = parseInt(params.get("nbins"));
  width = window.innerWidth - margin.left;
  height = window.innerHeight - margin.top;
  svg = d3.select("body")
    .append("svg")
      .attr("width", width)
      .attr("height", height);
  axis = [
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`),
    svg.append("g").attr("transform", `translate(${margin.left},0)`)];
  y = d3.scaleLinear()
       .domain([0, max_prob])
       .range([height - margin.bottom, margin.top]);
  axis[1].call(d3.axisLeft(y));
  h_lines = [1,2,3,4,5,6,7,8,9].map(c => {
    let h = y(c/10);
    return svg.append("line")
      .attr("stroke", "black")
      .attr("stroke-dasharray", "2 5")
      .attr("x1", margin.left).attr("x2", width-margin.right)
      .attr("y1", h).attr("y2", h);
    });
  name_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("fill", "blue").text(params.get("name")).attr("x", width-margin.right).attr("y", margin.top);
  iter_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue").attr("x", width-margin.right).attr("y", 2*margin.top);
  mean_line = svg.append("line").attr("stroke", "blue");
  mean_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
  window.addEventListener("message", message, false);
  window.addEventListener("resize", resize, false);
});

function message(e) {
  let json = JSON.parse(e.data);
  let iter = parseInt(json.iter);
  if (iter >= 0) {
    let value = parseFloat(json.value);
    iter_text.text("iter " + iter).attr("x", width-margin.right).attr("y", 2*margin.top);
    if (sims.length == 0) {
      href = value/10;
      domain = [value - href, value + href];
      x = d3.scaleLinear()
          .domain(domain)
          .range([margin.left, width - margin.right]);
      axis[0].call(d3.axisBottom(x));
    } else if (value <= domain[0]) {
      console.log("se va por la izquierda.")
      if (value>0) domain[0] = value - href;
      else domain[0] = value + href;
      x.domain(domain);
      axis[0].call(d3.axisBottom(x));
    } else if (value >= domain[1]) {
      console.log("se va por la derecha.")
      if (value>0) domain[1] = value + href;
      else domain[1] = value - href;
      x.domain(domain);
      axis[0].call(d3.axisBottom(x));
    }
    sims.push(value);
    summa += value;
    mean = summa / sims.length;
    repaint();
  } else {
    sims = sims.sort();
    let l = sims.length;
    qs = [sims[Math.round(l/4)], sims[Math.round(l/2)], sims[Math.round(3*l/4)]];
    q_texts = qs.map((q,i) => {
        return svg.append("text")
          .attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
          .attr("y", 2*(i+2)*margin.top);
        });
    q_texts1 = q_texts.map((q,i) => {
        return q.append("tspan")
          .text("Q" + (i+1))
          .attr("x", x(qs[i])-2)
          .attr("dy", 15);
        });
    q_texts2 = q_texts.map((q,i) => {
        return q.append("tspan")
          .text(qs[i])
          .attr("x", x(qs[i])-2)
          .attr("dy", 15);
        });
    q_lines = qs.map(q => x(q))
      .map((q,i) => {
        return svg.append("line")
          .attr("stroke", "blue")
          .attr("stroke-dasharray", "5 5")
          .attr("x1", q).attr("x2", q).attr("y1", height-margin.bottom).attr("y2", margin.top);
      });
    m_text = svg.append("text")
      .attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
    m_text1 = m_text.append("tspan")
      .attr("dy", 15);
    m_text2 = m_text.append("tspan")
      .attr("dy", 15);
    m_line = svg.append("line")
        .attr("stroke", "blue");
    mean_line.remove();
    mean_text.remove();
    stats = true;
    svg.on("mouseenter", x => {mouse=true;});
    svg.on("mouseleave", x => {mouse=false;});
    svg.on("mousemove", mousemove);
  }
}

function repaint() {
  let bins = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(nbins))
      (sims);
  let prob = Math.max.apply(Math, bins.map(b => b.length)) / sims.length;
  let prob_limit = .1 * (Math.ceil(prob/0.1));
  if (max_prob != prob_limit) {
    console.log("prob => " + max_prob);
    max_prob = prob_limit;
    y.domain([0, max_prob]);
    axis[1].call(d3.axisLeft(y));
  }

  svg.selectAll("rect")
      .data(bins)
      .join(
          enter => enter
              .append("rect")
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return height - margin.top - y(d.length/sims.length)})
              .style("fill", "green"),
          update => update
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return height - margin.top - y(d.length/sims.length)}));
  if (!stats) {
    let mean_x = x(mean)
    mean_line
      .attr("x1", mean_x)
      .attr("x2", mean_x)
      .attr("y1", height-margin.bottom)
      .attr("y2", margin.top);
    mean_text
      .text("mean=" + mean)
      .attr("x", mean_x-2)
      .attr("y", margin.top);
  }
}

function resize() {
  width = window.innerWidth - margin.left;
  height = window.innerHeight - margin.top;
  svg.attr("width", width).attr("height", height);
  x.range([margin.left, width - margin.right]);
  axis[0].attr("transform", `translate(0,${height - margin.bottom})`);
  axis[0].call(d3.axisBottom(x));
  y.range([height - margin.bottom, margin.top]);
  axis[1].attr("transform", `translate(${margin.left},0)`);
  axis[1].call(d3.axisLeft(y));
  h_lines.forEach((l,i) => {
    let h = y(max_prob/10*(i+1)/10);
    l.attr("x1", margin.left).attr("x2", width-margin.right)
    .attr("y1", h).attr("y2", h);
  });
  name_text.attr("x", width-margin.right).attr("y", margin.top);
  iter_text.attr("x", width-margin.right).attr("y", 2*margin.top);
  if (stats) {
    qs.map(q => x(q))
      .forEach((q,i) => {
        q_texts[i].attr("y", (i+2)*margin.top);
        q_texts1[i].attr("x", q-2);
        q_texts2[i].attr("x", q-2);
        q_lines[i].attr("x1", q).attr("x2", q).attr("y1", height-margin.bottom).attr("y2", margin.top);
      });
  }
  repaint();
}

function mousemove(e) {
  const coord = e.x;
  if ((coord>margin.left) && (coord<(width-margin.right))) {
    const value = x.invert(coord);
    const idx = sims.findIndex(x => x>value);
    let q;
    if (idx>=0) {q = Math.round(100 * (idx / sims.length));}
    else {q = 100;}

    m_text.attr("y", margin.top).attr("visibility", "visible");
    m_text1.text("Q=" + q + "%").attr("x", coord-2).attr("visibility", "visible");
    m_text2.text(value).attr("x", coord-2).attr("visibility", "visible");
    m_line.attr("x1", coord).attr("x2", coord).attr("y1", height-margin.bottom).attr("y2", margin.top).attr("visibility", "visible");
  } else {
    m_text.attr("visibility", "hidden");
    m_text1.attr("visibility", "hidden");
    m_text2.attr("visibility", "hidden");
    m_line.attr("visibility", "hidden");
  }
}
