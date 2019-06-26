var interval = 0;
var lastUpdateTime = new Date().getTime(); // start_time
var current_set = 1;
var current_rept = 1;
var total_rept = 1;
var total_sets = 1;
var totalSecs = 0;
var audio = new AudioContext();
var reptjs=[];
var distjs=[];
var timejs=[];
var remarkjs=[];
var sheetURL = "https://docs.google.com/spreadsheets/d/1cQBK0OURJGcY_jKpYPqLm_SK-X_d5cBsFtKVhB3dhJo";
var total_time = 0;
var total_distance = 0;

function pad(n) {
	// leading zeros
	return ('00' + n).substr(-2);
}

function MMSS2Secs(s) {
	// MM:SS format to Seconds
	return parseInt(s.substr(0, 2), 10) * 60 + parseInt(s.substr(3, 2), 10);
}

function Secs2MMSS(secs) {
	// Seconds to MM:SS format
	return pad(Math.floor(secs / 60)) + ':' + pad(secs % 60);
}

function Secs2HHMMSS(secs) {
	// Seconds to HH:MM:SS format
	return pad(Math.floor(secs/3600)) + ':' + pad(Math.floor(secs/60)%60) + ':' + pad(secs%60);
}

function tone(volume, frequency, duration) {
	// volume, frequency(Hz), duration(millis)
	v = audio.createOscillator();
	u = audio.createGain();
	v.connect(u);
	v.frequency.value = frequency;
	v.type = "square";
	u.connect(audio.destination);
	u.gain.value = volume * 0.01;
	v.start(audio.currentTime);
	v.stop(audio.currentTime + duration * 0.001);
}

function beep() {
	tone(50, 440, 150); // La or A is the sixth note ~ 440Hz
}

function update() {
	var now = new Date().getTime();
	var dt = now - lastUpdateTime;

	if (dt > 1000) {
		lastUpdateTime = now;
		totalSecs -= 1;
		if (totalSecs == 0) { // interval finished
			beep();
			console.log("interval finished");
			document.getElementById('timer').style.color = "yellow";
			current_rept += 1;
			if (current_rept == (total_rept + 1)) { // set finished
				console.log("set finished");
				current_rept = 1;
				current_set += 1;
				if (current_set == total_sets) { // workout finished
					clearInterval(interval);
					interval = 0;
					document.getElementById('timer').innerHTML = 'E N D';
					return;
				}
				total_rept = reptjs[current_set];
				document.getElementsByClassName("set")[current_set - 2].style.color = "white";
				document.getElementsByClassName("set")[current_set - 1].style.color = "pink";
			}
			totalSecs = MMSS2Secs(timejs[current_set]);
			document.getElementById('currentset').innerHTML = current_rept.toString() + " of " + total_rept.toString() + "x" + distjs[current_set] + " @" + timejs[current_set] + "<br>" + remarkjs[current_set];
		}
		if (totalSecs < 3) {
			beep();
			document.getElementById('timer').style.color = "red";
		}
		document.getElementById('timer').innerHTML = Secs2MMSS(totalSecs);
	}
}

function runWorkout() {
	if (!interval) {
		lastUpdateTime = new Date().getTime();
		totalSecs = MMSS2Secs(timejs[current_set]);
		document.getElementById('timer').innerHTML = timejs[current_set];
		document.getElementsByClassName("set")[current_set - 1].style.color = "pink";
		total_rept = reptjs[current_set];
		interval = setInterval(update, 250);
	}
}

function PauseWorkout() {
	clearInterval(interval);
	interval = 0;
}

function StopWorkout() {
	PauseWorkout();

	document.getElementsByClassName("set")[current_set - 1].style.color = "white";
	document.getElementById('timer').style.color = "yellow";
	current_set = 1;
	current_rept = 1;

	document.getElementById("currentset").innerHTML = "1 of " + reptjs[1] + "x" + distjs[1] + " @" + timejs[1] + "<br>" + remarkjs[1];
	document.getElementById("timer").innerHTML = timejs[1];
}

function main() {
	// Get workout from google sheets
	$.get(sheetURL + "/export?format=csv", function(data, status) {
	var v = [];
	var workouttext = "";
	
	data = data.split("\n");
	total_sets = data.length;
	console.log(total_sets);
    for (i = 1; i < total_sets; i++) {
      	v = data[i].split("\,");
		if (isNaN(v[1]) || v[1]=='') {
			reptjs[i] = 1;
		}
		else {
			reptjs[i]=parseInt(v[1]);
		}
		distjs[i]=v[2];
		timejs[i]=v[3];
		remarkjs[i]=v[4];
		total_time += v[1]*MMSS2Secs(v[3]);
		if (isNaN(v[2])) {
			total_distance += 0;
		}
		else {
			total_distance += v[1]*parseInt(v[2]);
		}
		console.log(i + ") " + reptjs[i] + "," + distjs[i] + "," + timejs[i] + "," + remarkjs[i]);
	}
	
	document.getElementById("totaltime").innerHTML = "Workout time: " + Secs2HHMMSS(total_time);
	document.getElementById("totaldistance").innerHTML = "Workout Distance: " + total_distance.toLocaleString();;

	// Fill Sets element in workout id
    for (i = 1; i < total_sets; i++) {
		workouttext += "<span class=\"set\">";
		if (reptjs[i]<2) {
			workouttext += distjs[i] + " @" + timejs[i];
		}
		else {
			workouttext += reptjs[i] + "x" + distjs[i] + " @" + timejs[i];
		}
		if (remarkjs[i]!="") {
			workouttext += "<br>" + remarkjs[i];
		}
		else {
			workouttext += "<br>&nbsp;";
		}
		workouttext += "</span><hr>";
	}
	console.log(workouttext);
	document.getElementById("workout").innerHTML = workouttext;

	// Fill current set element
	document.getElementById("currentset").innerHTML = "1 of " + reptjs[1] + "x" + distjs[1] + " @" + timejs[1] + "<br>" + remarkjs[1];

	// Fill timer element
	document.getElementById("timer").innerHTML = timejs[1];
});
}