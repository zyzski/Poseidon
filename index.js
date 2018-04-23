global.log = require('./classes/logger');
global.config = require("./config/config.json");
const async = require("async");
const cluster = require('cluster');
const cpuCount = require('os').cpus().length;
const jsonSplit = require('json-array-split');
const tools = require("./classes/tools");
const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));
const chalk = require("chalk");

if (config.use_captcha) {
	global.captchaDB = redis.createClient({host: config.capDB.split(':')[0], port: config.capDB.split(':')[1]});
}

if (config.use_sensor) {
	global.sensorDB = redis.createClient({host: config.sensDB.split(':')[0], port: config.sensDB.split(':')[1]});
}

if (cluster.isMaster) {
	log("-----------------------");
	log("Poeseidon", "info");
	log("developed by: Euph ", "info");
	log("-----------------------");

	if (config.sensDB.split(':')[0] && config.use_sensor) {
		sensorDB.on("error", (err) => {
			log("DB Error " + err);
		});

		sensorDB.on("connect", () => {
			log(`Sensor DB connected: [${config.sensDB.split(':')[0]}]`, "info");
		});
	}

	if (config.capDB.split(':')[0] && config.use_captcha) {
		captchaDB.on("error", (err) => {
			log("DB Error " + err);
		});

		captchaDB.on("connect", () => {
			log(`Captcha DB connected: [${config.capDB.split(':')[0]}]`, "info");
		});
	}

}
if (config.use_proxies) {
	global.proxies = require("./config/proxies.json");

	if (config.debug) {
		log(`Loaded ${proxies.length} proxies(s)`)
	}
}


let jsonData = [];

for (let i = 0; i < config.tasks; i++) {

	jsonData.push(Date.now() / 100 + tools.randomNumber(0, 1203120301203210));
}
let splitAmount = Math.ceil(jsonData.length / cpuCount);
let taskCluster = jsonSplit(jsonData, splitAmount);


if (cluster.isMaster) {
	log(`CPU Cores: ${cpuCount}`, "info");
	log(`Total Tasks: ${config.tasks} | Per CPU Core: ~${splitAmount}`, "info");
	log(`Total Proxies: ${(config.use_proxies) ? proxies.length : 'Disabled'}`, "info");
	log("-----------------------");
}


let stack = [];

if (cluster.isMaster) {
	for (let i = 0; i < cpuCount; i++) {
		cluster.fork();
	}
	Object.keys(cluster.workers).forEach(function (id) {
		log(`[T${cluster.workers[id].id}] Starting Worker on CPU ${cluster.workers[id].id}`)
	});
} else {
	function start(x) {
		let adidas = require('./classes/adidas');
		adidas.main(x, cluster.worker.id - 1)
	}

	try {
		for (let i = 0; i < taskCluster[cluster.worker.id - 1].length; i++) {
			stack.push(start(i))
		}
	} catch (e) {
		// console.log(e);
		//log(`[T${cluster.worker.id}] No accounts to run on this thread.`)
	}
	async.each(stack, function (res, err) {
	});

}