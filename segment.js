//
// Function to draw segments of the doughnut
//
function drawSegment (canvas, innerRadius, outerRadius, startAngle, endAngle, fillColor) {
      var context = canvas.getContext('2d');

	// Segment variables
      var x = canvas.width / 2;
      var y = canvas.height / 2;

		// Draw connected arcs
		context.beginPath();
		context.arc(x, y, innerRadius, startAngle, endAngle, true);
		context.lineWidth = 2;
		context.arc(x, y, outerRadius, endAngle, startAngle, false);
		context.closePath();

		// line color
		context.fillStyle = fillColor;
		context.fill();
		context.strokeStyle = 'white';
		context.stroke();
			
}

//
// Main function defining the segments
//
function defineSegments (innerRadius, w, h, csvchrom, csvsnp) {
	// chroms is an array of chromosome objects
	// chroms[0].name = first chromosome name
	// chroms[0].size = first chromosome size
	// etc.
	
	var chroms = generateChromosomes (csvchrom);
    var snvs = generateSNPs (csvsnp);
	
	supports_html5_storage(); // Check for local storage capability
	
	// Clear local storage
	clearLocalStorage ();
	
	// Set up the DIV
	var div = document.getElementById("radialDisplay");
	div.style.position='relative';
	setUpDiv (div, w, h);
	
	// Set the infobox style	
	var info = document.getElementById("information");
	setInfoBoxStyle(info);
	
	var canvas = document.getElementById('chromGraph');
	
	// First need total genome size to divide by total radians available (1.8) for doughnut
	var genomeSize = 0;
	for (var i = 0; i < chroms.length; i++) {
		genomeSize = genomeSize + chroms[i].size;
	}
	
	// Need to divide into appropriate sections now (need a start and end radian for each
	var segments = new Array();
	var currentStart = 1.4;
	var currentEnd = -0.4;
	var fillColors = generateColorArray (chroms.length);
	
	for (var i = 0; i < chroms.length; i++) {
		var percnt = chroms[i].size / genomeSize; // Percentage of the doughnut taken up by this segment
		var radianSize = 1.8 * percnt; // Convert to how many radians
		var thisEnd = currentStart - radianSize; // Determine end of arcs
		if (thisEnd < 0) thisEnd = thisEnd + 2; // Fix -.1 to -.4 to be 1.9, 1.8 ... 
			
		// determine radius size
		var outerRadius = innerRadius + 25 + (chroms[i].snpspercent * 150);
		
		// Draw segment
		drawSegment (canvas, innerRadius, outerRadius, (currentStart * Math.PI), (thisEnd * Math.PI), fillColors[i].getCSS(0));
		
		// Determine SNPs that show up
		var _tmpSNVs = new Array();
		var c = 0;
		for (var j = 0; j < snvs.length; j++) {
			if (snvs[j].chrom == chroms[i].name) {
				//console.log ("Equal");
				_tmpSNVs[c] = snvs[j];
				//console.log ("_tmpSNVs: " + _tmpSNVs[c].chrom);
				c++;
			}
		}

		// Save segment
		segments[i] = new segment(chroms[i], (currentStart * Math.PI), (thisEnd * Math.PI), fillColors[i].getCSS(0), innerRadius, outerRadius, fillColors[i].getCSS(1), JSON.stringify(_tmpSNVs), JSON.stringify(fillColors[i]));
		// Draw SNPs
		if (segments[i].snps.length > 0 )
			drawSNPS(segments[i], canvas);
		
		// Save local segments
		saveSegment(i, segments[i]);
		
		// Move start position for next segment
		currentStart = thisEnd;
	}
	
	// Set up the mouseover events
	setUpListener (canvas);
}

//
// Draw snps
//

function drawSNPS (segment, canvas) {
	var context = canvas.getContext('2d');
	
	// Center of the circle
    var x = canvas.width / 2;
    var y = canvas.height / 2;
	  
	var snpStart = segment.start;
	var snpEnd = segment.end;
	
	// Map points to place on arc....i.e. each bp is mapping amount of the arc
	var mapping;
	if (snpStart > snpEnd) mapping = ((snpStart - snpEnd) / segment.size);
	else mapping = ((snpStart + (2 * Math.PI - snpEnd)) / segment.size);

	for (var j = 0; j < segment.snps.length; j++) {
	     
		 var outerRadius = segment.inner + 10 + ((segment.snps[j].coverage / 100) * 40);
		// Draw connected arcs
		context.beginPath();
		var snpStart =(segment.start - (mapping * segment.snps[j].location));
		var snpEnd = (segment.start - (mapping * segment.snps[j].location + .01));
		context.arc(x, y, (segment.inner + 1), snpStart, snpEnd, true);
		context.arc(x, y, (outerRadius + 1), snpEnd, snpStart, false);
		context.closePath();
		
		var color = "rgb(" + (segment.css.r - 30) + "," + (segment.css.g - 30) + "," + (segment.css.b - 30) + ")";
		// line color
		context.lineWidth = 0.01;
		context.fillStyle = color;
		context.fill();
		context.strokeStyle = color;
		context.stroke();
		
	}
}
//
// Create the mouse listener event to tell when hovering over a segment
//

var currentSegment = -1; // Global variable with current segment that is highlighted
function setUpListener (canvas) {
	canvas.addEventListener('mousemove', function (evt) {
		// Define context
		var context = canvas.getContext('2d');
		
		// Get positions
		var parentPosition = getPosition(event.currentTarget);
    	var xPosition = event.clientX - parentPosition.x;
    	var yPosition = event.clientY - parentPosition.y;
				
		// If moves over segment, need to redraw all others then highlight that one
		// Need to re-draw (not refresh) and check each.

		// Define center of canvas
		var x = canvas.width / 2;
		var y = canvas.height / 2;
		var found = 0;
		var snpbox = 0;
		
		// Loop through and check for existing in a segment
		for (var i = 0; i < localStorage.length; i++) {
			// Retrieve the segment from local storage
			var segment = getSegment(i);
			// Draw the segment path to check for point in path.
			context.beginPath();
			context.arc(x, y, segment.inner, segment.start, segment.end, true);
			context.arc(x, y, segment.outer, segment.end, segment.start, false);
			context.closePath();
						
			// Check if current mouse point is in the segment
			if (context.isPointInPath(xPosition, yPosition)) {
				found = 1;
				
				//--------------------------------------------
				// Now check if over one of the SNPs in segment.
					// Center of the circle
				var x = canvas.width / 2;
				var y = canvas.height / 2;

				var snpStart = segment.start;
				var snpEnd = segment.end;
				
					// Map points to place on arc....i.e. each bp is mapping amount of the arc
				var mapping;
				if (snpStart > snpEnd) mapping = ((snpStart - snpEnd) / segment.size);
				else mapping = ((snpStart + (2 * Math.PI - snpEnd)) / segment.size);

				for (var j = 0; j < segment.snps.length; j++) {
					 var outerRadius = segment.inner + 10 + ((segment.snps[j].coverage / 100) * 40);
					// Draw connected arcs
					context.beginPath();
					var snpStart =(segment.start - (mapping * segment.snps[j].location));
					var snpEnd = (segment.start - (mapping * segment.snps[j].location + .01));
					context.arc(x, y, (segment.inner + 1), snpStart, snpEnd, true);
					context.arc(x, y, (outerRadius + 1), snpEnd, snpStart, false);
					context.closePath();
					if (context.isPointInPath(xPosition, yPosition)) {
						snpbox = 1;
						drawSNPBox(xPosition, yPosition, segment.snps[j]);
					} else snpbox = 0;
				}
				//----------------------------------------------
				
				// Redraw canvas with this segment highlighted
				if(currentSegment != parseInt(localStorage.key(i))) {
					redraw(segment, context, canvas);
					currentSegment = parseInt(localStorage.key(i));
				}
				// Draw popup box near mouse
				if(!snpbox) drawInfoBox(xPosition, yPosition, segment);
			}
			
		}
		if (!found && !snpbox) {
			clearInfoBox ();
			if(currentSegment != -1) redraw(0, context, canvas);
			currentSegment = -1;
		}
	}, false);
}

//-------------------------------------
// Support Functions
//-------------------------------------

// generate color array
function generateColorArray (count) {
	var r = 74;
	var g = 46;
	var b = 207;

	var color = new Array();
	color[0] = new colorRGBA(r,g,b,.6);

	for (var i = 1; i < count; i++) {
		r = r + 23;
		if (r > 255) r = r - 256; 
		g = g + 13;
		if (g > 255) g = g - 256; 
		b = b + 63;
		if (b > 255) b = b - 256; 
		color[i] = new colorRGBA(r,g,b,.6);
	}
	
	return color;
}


// redraw with var highlighted
function redraw(segment, context, canvas) {
	context.clearRect(0, 0, canvas.width, canvas.height);
	//alert("redraw");
	for (var i = 0; i < localStorage.length; i++) {
		var _segment = getSegment(i);
		drawSegment (canvas, _segment.inner, _segment.outer, _segment.start, _segment.end, _segment.color);
		// Draw SNPs
		if (_segment.snps.length > 0 )
			drawSNPS(_segment, canvas);
	}
	if (segment != 0) {
		drawSegment (canvas, segment.inner, segment.outer, segment.start, segment.end, segment.color);
		// Draw SNPs
		if (segment.snps.length > 0 )
			drawSNPS(segment, canvas);
	}
}

// draw info box
function drawInfoBox(xPosition, yPosition, segment) {
	var info = document.getElementById("information");
	info.style.left = parseInt(xPosition + 5) + 'px';
	info.style.top = yPosition + 'px';
	var percent = Number((parseFloat(segment.snpspercent) * 100).toFixed(2));
	var text = segment.name + "<br />Size (bps): " + segment.size + "<br />SNVs: " + percent + "%";
	info.innerHTML = text;
	info.style.display = 'inline';
}

function setInfoBoxStyle (info) {
	info.style.position='absolute';
	info.style.display='none';
	info.style.zIndex='200'; 
	info.style.padding='3px';
	info.style.marginLeft='10px';
	info.style.marginTop='5px';
	info.style.border='2px solid white';
	info.style.backgroundColor='rgba(51,51,51,.8)';
	info.style.color='white';
	info.style.fontSize='0.95em';
}

function setUpDiv (div, w, h) {
	var htm = "<canvas id=\"chromGraph\" width=\"" + w + "\" height=\"" + h + "\"></canvas><div id=\"information\">Tool tip</div>"
	div.innerHTML = htm;
}

function drawSNPBox(xPosition, yPosition, snp) {
	var info = document.getElementById("information");
	info.style.left = parseInt(xPosition + 5) + 'px';
	info.style.top = yPosition + 'px';
	
	var text = snp.chrom + "<br />Location: " + snp.location + "<br />Reference: " + snp.ref + "<br />SNV: " + snp.snv + "<br />Coverage: " + snp.coverage;
	info.innerHTML = text;
	info.style.display = 'inline';
}

function clearInfoBox () {
	var info = document.getElementById("information");
	info.style.display = 'none';
}


// Return mouse position in canvas.
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;
      
    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }
    return { x: xPosition, y: yPosition };
}

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
	console.log("Doesn't have local storage\n");
    return false;
  }
}

// Clear filesystem
function clearLocalStorage () {
	localStorage.clear();
}

// Save the segment locally
function saveSegment (i, segment) {
	localStorage[i] = JSON.stringify(segment);
}

// get a local segment value
function getSegment (i) {
	var _tmp = localStorage[i];
	//console.log("Get seg");
	//console.log(JSON.parse(_tmp).highlight);
	return JSON.parse(_tmp);
}

//--------------------------------------
// Object Definitions
//--------------------------------------
function chromosome(name,size,snpspercent) {
	this.name = name; // Chromosome Name
	this.size = size; // Size of the chromosome
	this.snpspercent = snpspercent; // SNP Percent
}

function snp (chrom, location, ref, snv, coverage) {
	this.chrom = chrom;
    this.location = location;
	this.ref = ref;
	this.snv = snv;
	this.coverage = coverage;
}

function segment(chrm,start,end,color,inner,outer, highlight, snps, css) {
	var _snps = JSON.parse(snps);
	var _css = JSON.parse(css);
	
	this.name = chrm.name;
	this.size = chrm.size;
	this.snpspercent = chrm.snpspercent;
	this.start = start;
	this.end = end;
	this.color = color;
	this.inner = inner;
	this.outer = outer;
	this.highlight = highlight;
	this.snps = _snps;
	this.css = _css
}

function colorRGBA (r, g, b, alpha) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.alpha = alpha
	this.getCSS = getCSS; // 0 for normal, 1 for highlight
}

function getCSS (highlight) {
	var _tmp = "rgba(";
	if (!highlight)
		_tmp = _tmp + this.r + "," + this.g + "," + this.b + ", 0.4)";		
	else if (highlight)
		_tmp = _tmp + this.r + "," + this.g + "," + this.b + ", 1.0)";
	return _tmp;
}

function generateChromosomes (csv) {
	var chroms = new Array ();
	var __csv = csv.split("\n");
		console.log(__csv.length);
	for (var i = 0; i < __csv.length; i++) {
		var _csv = __csv[i].split(",");
		chroms[i] = new chromosome(_csv[0], parseInt(_csv[1]), parseFloat(_csv[2]));
		console.log(_csv[0] + " " + _csv[1] + " " + _csv[2]);
		console.log(chroms[i]);
	}
	return chroms;
}

function generateSNPs (csvsnp) {
	var snps = new Array ();
	var __csv = csvsnp.split("\n");
	console.log(__csv.length);
	for (var i = 0; i < __csv.length; i++) {
		var _csv = __csv[i].split(",");
		snps[i] = new snp(_csv[0], parseInt(_csv[1]), _csv[2], _csv[3], parseInt(_csv[4]));
		console.log(snps[i]);
	}	
	return snps;
}