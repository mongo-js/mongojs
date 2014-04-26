#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var TIMEOUT = 20000;

var tests = fs.readdirSync(__dirname).filter(function(file) {
	return !fs.statSync(path.join(__dirname,file)).isDirectory();
}).filter(function(file) {
	return /^test(-|_|\.).*\.js$/i.test(file);
}).sort();
var copy = tests.slice(0);
var harmony = false;

var cnt = 0;
var all = tests.length;

var callback = function() {
	if (harmony) return;
	console.log('\nRunning tests with the --harmony flag.\n');

	cnt = 0;
	tests = copy;
	harmony = true;
	loop();
};

var loop = function() {
	var next = tests.shift();

	if (!next) {
		console.log('\033[32m[ok]\033[39m  all ok');
		return callback();
	}

	var command = 'node ';
	if (harmony) command += '--harmony '

	exec(command + path.join(__dirname,next), {timeout:TIMEOUT}, function(err) {
		cnt++;

		if (err) {
			console.error('\033[31m[err]\033[39m '+cnt+'/'+all+' - '+next);
			console.error('\n      '+(''+err.stack).split('\n').join('\n      ')+'\n');
			return process.exit(1);
		}

		console.log('\033[32m[ok]\033[39m  '+cnt+'/'+all+' - '+next);
		setTimeout(loop, 100);
	});
};

loop();
