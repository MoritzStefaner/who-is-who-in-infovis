$(document).ready(function() {
    log("here we go");
    loadData();
});


function loadData() {
	// google spreadsheets URL
	// make sure to switch on "publish to web"
	
    var url = "https://spreadsheets.google.com/pub?hl=en&hl=en&key=0AkTjJmB1VuOXdG1sNTBiZkowczBXRWtSOXJuOFFsN3c&single=true&gid=0&output=txt";
	
	// use local data
	url = "data/InfovisPeople.tsv";

	// use proxy script if run on web server
	if(document.location.protocol == "http:"){
		url = "proxy.php?link=" + escape(url); 
	}
    
	var callback = function(data) {
		log("data loaded");
		
		// parse data
		/*
		
		name, url, category
		David McCandless	http://www.davidmccandless.com/	Artist/Designer
		
		->
		
		[{name:"David McCandless", url:"http://www.davidmccandless.com/", category:"Artist/Designer"}]
		
		*/
		
		// split by lines
	    var a = data.split(/\r\n|\r|\n/);

	    dataSet = [];

		// get first row
	    headers = a.shift().split(/\t/);
	    log("headers", headers);

 		 for (var i = 0; i < a.length; i++) {
				// get columns per row
	            var l = a[i].split(/\t/);
	            var o = {};

	            for (var j = 0; j < l.length; j++) {
					// assign properties based on header names
	                o[headers[j]] = l[j];
	            }
				dataSet.push(o);
	        }

        initVis();
    };
    $.get(url, callback);
}

function initVis() {
    var width = window.document.width-30,
    height = window.document.height-100,
	padding = 50,
	
	// set up visualization
    vis = new pv.Panel().canvas(document.getElementById("protovis")).width(width).height(height),

	// set up axes
    x = pv.Scale.linear(0, dataSet.length - 1).range(padding, width - padding*2),
    y = pv.Scale.linear(0, 1).range(height - padding, padding);

	// sort data
    dataSet.sort(function(a, b) {
        if (a.category > b.category) return 1;
        if (b.category > a.category) return -1;
		return a.googleHits - b.googleHits;
    });

	// color by category
    var color = pv.Colors.category10().by(function(d) {
        return d.category;
    })

	// log transform
    var logTransform = function(n) {
        return Math.log(10 * n + 1) / Math.log(11)
    };

	// define dots
    var dot = vis.add(pv.Dot)
    .data(dataSet)
    .size(function(d) {
        return 120 * logTransform(d.percent);
    })
    .top(function(d) {
        return y(logTransform(d.percent))
    })
    .left(function(d) {
        return x(this.index)
    })
    .strokeStyle(color)
    .lineWidth(.5)
    .fillStyle(color)
    .title(function(d) {
        return d.name || "";
    })
	.cursor("pointer")
  	.event("click",
    	function(d) {
        	window.open(d.url);
    })
	;

	// label (name)
    dot.anchor("right").add(pv.Label)
    .text(function(d) {
        return d.name || "";
    })
    .textAngle(Math.PI / 6)
	.textBaseline("bottom")
    .textStyle(new pv.Color.Hsl(.65, .50, .10, .75))
    .font('11px "Helvetica"')
    ;

	// label (number of hits)
   	dot.anchor("right").add(pv.Label)
    .text(function(d) {
        return d.googleHits + " hits" || "";
    })
    .textAngle(Math.PI / 6)
	.textBaseline("top")
    .textStyle(new pv.Color.Hsl(.65, .50, .10, .33))
    .font('11px "Helvetica"')
    ;

    vis.render();
}