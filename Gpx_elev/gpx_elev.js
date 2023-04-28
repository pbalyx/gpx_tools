
var URLbase = 'https://wxs.ign.fr/calcul/alti/rest/elevation.json?';

var input_file_name;
var output_file_name;
var NbPts;
var ptsNodes;
var gpxXml;
var nSpace;
var currentFile;
var input_file_div = document.getElementById('input_file_div');
var input_file_span = document.getElementById('input_file_span');
var output_file_span = document.getElementById('output_file_span');

const ptsInLoop = 10;  

//region Read file

document.getElementById('file_select').addEventListener('change', handleFileSelect, false);
function handleFileSelect(evt) {
	const fileList = evt.target.files; // FileList object
	currentFile = fileList[0];
//console.log(fileList);
	readFile(currentFile);
}

input_file_div.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  // Style the drag-and-drop as a "copy file" operation.
  event.dataTransfer.dropEffect = 'copy';
});

input_file_div.addEventListener('drop', (event) => {
    event.stopPropagation();
	event.preventDefault();
	const fileList = event.dataTransfer.files;
	currentFile = fileList[0];
//  console.log(fileList);
	readFile(currentFile);
});

function readFile(_file) {
	input_file_name = _file.name; 
	input_file_span.innerHTML = input_file_name;
	output_file_span.innerHTML = "";;
	
	var reader = new FileReader(); 
	reader.readAsText(_file, "UTF-8");
	reader.onload = function (evt) {								//onload : lecture terminée ok
		gpxText = evt.target.result;
		var parser = new DOMParser();
		gpxXml = parser.parseFromString(gpxText, "text/xml");
		nSpace =gpxXml.documentElement.namespaceURI;
	console.log(nSpace);
		testNode = gpxXml.getElementsByTagName("gpx");
		if (testNode.length > 0) {
			ptsNodes = gpxXml.getElementsByTagName("trkpt"); 
			NbPts = ptsNodes.length;
		
console.log('read ok  ', _file.name, NbPts, '  points');
		b_process_file.style.display ="inline";
		}	
		 else {
console.log(_file.name, " bad file");
		}
	}
}

//endregion

// region process file (promise)

b_process_file.onclick = processFile;

function makeRequest(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(Error(xhr.statusText));
      }
    };
    xhr.onerror = function() {
      reject(Error("Network Error"));
    };
    xhr.send();
  });
}


function processFile() {
  var promises = [];
  
	//double boucle ici
	nbLoops = Math.floor((NbPts - 1)/ptsInLoop) + 1; //avoid empty string (ex: 190 pts 10 ptsinloop)
	var iStart, iEnd;
    for (let j = 0; j < nbLoops; j++) {
		iStart = j * ptsInLoop;
		iEnd = (j + 1) * ptsInLoop; 
		if (iEnd > NbPts) {iEnd = NbPts};
		const lonStrs = [];
		const latStrs = [];
		for (let i = iStart; i < iEnd; i++) {
			const point = ptsNodes[i];
			lonStrs.push(point.getAttribute('lon'));
			latStrs.push(point.getAttribute('lat'));
		}
		const requestStr = 'lon=' + lonStrs.join('|') + '&lat=' + latStrs.join('|') + '&zonly=true'; 
		const URLFull = URLbase + requestStr;
		
//		callAPI(URLFull, reponseCallback, j);
		var promise = makeRequest(URLFull);
		promises.push(promise);		
	}
 
  
/*  for (var i = 0; i < urls.length; i++) {
    var promise = makeRequest(urls[i]);
    promises.push(promise);
  }*/

Promise.all(promises).then(function(results) {
	for (var j = 0; j < results.length; j++) {
		treatResult(j, results[j])
	}
	}).catch(function(error) {
		console.log(error);
	});

function updateNodeElev(fullIndex, eleStr) {
	var node = ptsNodes[fullIndex];
	if (!node.getElementsByTagName("ele")[0]) {
		var ele = gpxXml.createElementNS( nSpace, "ele");
		node.appendChild(ele);
	}
	node.getElementsByTagName("ele")[0].textContent = eleStr;
}
  
  function treatResult(index, resultStr) {
	const elevArray = JSON.parse(resultStr).elevations;
//	console.log(index, elevArray);
    for (var i = 0; i < elevArray.length; i++) {
		updateNodeElev((i + index * ptsInLoop), elevArray[i]);
	}
	f_name = currentFile.name;
	shortFileName = f_name.substring(0, f_name.lastIndexOf('.'));
	output_file_name = shortFileName + '_ele.gpx';
	output_file_span.innerHTML = output_file_name;
	b_save_file.style.display ="inline";
 }
}


// endregion

// region save file

b_save_file.onclick = downloadFile;

function downloadFile() {
	const serializer = new XMLSerializer();
	const gpxStringTmp = serializer.serializeToString(gpxXml);
	var gpxString;
//console.log(gpxStringTmp.indexOf("trkpt\>\n\<trkpt"));
	if (gpxStringTmp.indexOf("trkpt\>\n\<trkpt") > 0) {  //newline already present
		gpxString = gpxStringTmp;
	} else {gpxString = gpxStringTmp.replaceAll("\<trkpt", "\n<trkpt")};	
//console.log(gpxString);
	writeFile(gpxString, output_file_name);
}

function writeFile (strToWrite, _fileNameToSaveAs) {
	var textToSaveAsBlob = new Blob([strToWrite], {type:"text/plain"});
	var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
	var downloadLink = document.createElement("a");
	downloadLink.download = _fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	downloadLink.href = textToSaveAsURL;
	downloadLink.onclick = destroyClickedElement;
	downloadLink.style.display = "none";
	document.body.appendChild(downloadLink);
 
 //comment next line to avoid create gpx file and to see the console.log
	downloadLink.click();

	function destroyClickedElement(event){
		document.body.removeChild(event.target);
	}
}

// endregion

// region Point
var point_elev = document.getElementById('point_elev');

b_treat_point = document.getElementById("b_treat_point");
pointInput = document.getElementById("pointInput");
b_treat_point.onclick = getPointElev;

function getPointElev() {
var lonStr, latStr;
var	ptStrs ;
	ptStrs = pointInput.value.split(',');
	lonPrm = 'lon=' + ptStrs[0].trim();
	latPrm = 'lat=' + ptStrs[1].trim();
	URLFull = URLbase + lonPrm + '&' +latPrm + '&zonly=true';  
		console.log(URLFull);
	var httpRequest = new XMLHttpRequest();
	httpRequest.open('GET', URLFull);
	httpRequest.onload = function() {
		responseStr = httpRequest.response;
		var result = responseStr.substring(responseStr.indexOf("[")+1, responseStr.indexOf("]"));
//console.log(responseStr, responseStr.substring(responseStr.indexOf("[")+1, responseStr.indexOf("]")));
	point_elev.innerHTML =  " " + result + " m";	
	}
	httpRequest.send();
}

// endregion

