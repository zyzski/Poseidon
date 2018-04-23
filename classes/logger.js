const chalk     = require("chalk");
const moment    = require('moment');
const config 	= require("../config/config.json")

const log 		= (message, color, elapse) => {
	const colors = {
		"error" 		: "\033[91m",
		"success" 		: "\033[92m",
		"info" 			: "\033[96m",
		"debug" 		: "\033[95m",
		"yellow" 		: "\033[93m",
		"lightpurple"   : "\033[94m",
		"lightgray"     : "\033[97m",
		"reset"			: "\033[00m"
	};

	let msg = "";

	if(color) {
		msg += colors[color] + message + colors["reset"]
	} else {
		msg = message
	}
	
	console.log(`[${moment().format('h:mm:ss:SS.SSS')}] ${msg} ${(elapse !== undefined) ? chalk.yellowBright(`+${elapse} ms`) : ""}`)
};

module.exports = log;