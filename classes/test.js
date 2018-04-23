const tools 	= require("./tools");
const faker 	= require("faker");
const moment 	= require("moment");
const request 	= require("request-promise");
const cheerio 	= require("cheerio");
const chalk		= require("chalk");
const Slack 	= require("slack");
const bot 		= new Slack();
const Fake 		= faker.fake;
const nike 		= {};
const _ 		= require("underscore");
const querystring = require("querystring");
const tough 	= require("tough-cookie");
const Cookie 	= tough.Cookie;

/* Magic*/
Array.prototype.clear = function() {
	this.splice(0, this.length);
};

process.on("unhandledRejection", (reason, p) => {
	console.log("FATAL ERROR");
	console.log(reason)
}).on("uncaughtException", err => {
	console.log("FATAL ERROR");
	console.log(err)
});

nike.main = async (x, cpuThread, restart) => {
	const j         = require("request").jar();
	const defaults  = {};
	defaults["jar"] = j;

	defaults["headers"] = {
		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
	};

	if (config.use_proxies) {
		defaults["proxy"]   = "http://" + tools.returnRandom(proxies);
	}  else {
		defaults["proxy"]	= null
	}

	const req       = request.defaults(defaults);
	config.locale   = config.splash.Country.toUpperCase();

	if (config.locale === "UK") {
		config.locale = "GB"
	}

	const random_pid    = tools.returnRandom(config.splash.Pid);
	
	const api_details   = {
		"cpuThread"     : cpuThread,
		"defaults"      : defaults,
		"pid"           : random_pid,
		"searchURL"     : `https://www.adidas.${tools.getLocale(config.locale)[0]}/api/suggestions/${random_pid}`,
		"jar"           : j,
		"start"         : moment.now(),
		"amount_scrape" : 0,
		"req"           : req,
		"x"             : x,
		"splashURL"     : config.splash.splashURL,
		"stockURL"      : `https://www.adidas.${tools.getLocale(config.locale)[0]}/on/demandware.store/Sites-adidas-${config.locale}-Site/default/Product-GetAvailableSizes?pid=${random_pid}`
	};

	// if (config.debug) {
	// 	console.log(defaults)
	// }
	nike.get_shoe(api_details);

	// if (!config.sizes.length) {
	// 	adidas.dynamicSize(api_details);
	// }
};

nike.get_shoe = async (api_details) => {

	const headers = {
		"DNT"               : "1",
		"Accept-Encoding"   : "gzip, deflate, br",
		"Accept-Language"   : "en-US,en;q=0.9",
		"Upgrade-Insecure-Requests": "1",
		"User-Agent"        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.88 Safari/537.36",
		"Accept"            : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		"Cache-Control"     : "max-age=0",
		"Connection"        : "keep-alive",
	};

	const options = {
		url		: "https://www.nike.com/launch//",
		headers	: headers,
		jar		: api_details.jar,
		resolveWithFullResponse: true,
		gzip	: true
	};

	try {

		const resp 	= await api_details.req(options);
		if (resp.headers["set-cookie"] instanceof Array)
			cookies = resp.headers["set-cookie"].map(Cookie.parse);
		else
			cookies = [Cookie.parse(resp.headers["set-cookie"])];
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i];
			if (cookie.key === "bm_sz") {
				log(`[T${api_details.cpuThread}][${api_details.x}] Got BM`, "success");
			}
			if (cookie.key === "_abck") {
				log(`[T${api_details.cpuThread}][${api_details.x}] Got Preabck`, "success");
				api_details.preabck = `${cookie.key}=${cookie.value}`;
				console.log(api_details.preabck);
			}
		}
		nike.abck(api_details);
	} catch (e) {
        log(`[T${api_details.cpuThread}][${api_details.x}] Error Grabbing BM`, "error");
	}
};

nike.abck = async (api_details) => {
	const dataString 	= {
		"sensor_data": "7a74G7m23Vrp0o5c9983076.78-6,2,-36,-495,Mozilla/9.8 (Windows NT 52.1; Win85; x70) AppleWebKit/691.17 (KHTML, like Gecko) Chrome/07.1.2890.230 Safari/484.57,uaend,93432,72189113,en-US,Gecko,4,6,2,1,221372,1216065,4877,3199,2562,2375,6265,955,3733,,cpen:9,i7:2,dm:5,cwen:1,non:2,opc:2,fc:1,sc:1,wrc:3,isc:6,vib:0,bat:6,x27:2,x41:8,0472,1.627149467319,777164239898,loc:-7,4,-23,-622,do_en,dm_en,t_en-1,8,-75,-670,-6,2,-36,-497,5,1,0,1,6603,0705,2;0,1,5,8,5561,098,0;6,2,1,9,9668,838,4;8,3,5,5,3821,463,1;-6,7,-43,-740,1,0,8304,undefined,5,5,-6;1,8,3698,undefined,4,8,-0;9,3,6780,undefined,1,9,-7;5,3,0365,undefined,3,5,-3;9,1,9365,undefined,1,4,-2;4,9,5097,undefined,5,1,-1;2,3,5127,-6,5,0,-5;5,5,9688,-3,1,4,-2;7,8,32331,-6,8,3,6982;4,3,75023,-7,5,1,0246;38,5,68459,-2,6,2,2525;63,6,12526,-5,5,5,2720;76,1,40459,-7,0,6,3043;60,4,61062,-0,3,5,6445;15,5,93461,-4,5,0,7658;44,0,33666,-6,8,3,6982;65,3,54074,-9,2,5,1394;98,0,87495,-3,4,8,4187;39,2,28608,-1,7,2,6131;51,3,07026,-1,1,4,9369;95,2,03975,-3,9,7,3389;37,5,26768,-3,9,1,5411;17,6,28777,-4,1,9,8751;13,9,31905,-7,1,9,2872;37,7,65944,-8,2,1,0705;30,2,78289,-7,5,1,0246;44,4,61577,06,6,0,2525;79,6,15873,-5,5,3,2720;82,1,43707,-7,0,4,3043;76,4,63340,34,3,5,6445;31,6,95631,-4,5,0,7658;60,8,35976,-6,8,3,6982;81,4,56290,-9,2,5,1394;14,1,89701,-3,4,8,4187;55,0,20057,-1,7,2,6131;77,4,09381,-1,1,4,9369;01,3,04846,-3,9,7,3389;43,3,27779,-3,9,1,5411;23,8,29723,-4,1,9,8751;29,7,32066,-7,1,9,2872;53,8,66086,-8,2,1,0705;56,2,79292,-7,5,1,0246;60,5,62574,-2,6,2,2525;95,6,16730,-5,5,5,2720;08,1,44663,-7,0,6,3043;92,4,64328,-0,3,5,6445;47,5,96622,-4,5,0,7658;76,0,36827,-6,8,3,6982;97,2,57238,-9,2,5,1394;20,2,80631,-3,4,8,4187;71,1,21855,-1,7,2,6131;93,3,00259,-1,1,4,9369;27,2,05768,7,3,5,6445;-2,6,-07,-862,5,1,732,2417,80;6,1,733,2751,653;1,2,633,4530,372;3,7,434,0487,228;5,5,338,6656,00;6,5,305,6555,75;7,5,439,6428,75;8,5,628,6349,70;9,5,698,6451,66;0,5,9211,8240,11;74,9,4172,3891,30;39,4,6919,6645,66;25,8,6517,1808,05,-6;65,6,1498,9874,99;29,4,7719,4692,45,-1;79,0,4248,3894,30,-9;45,8,3579,2387,37;64,3,6800,5926,10;60,6,1072,9873,93;24,1,7352,4684,57;10,7,3751,6474,94;37,3,2259,6884,65;64,2,0455,2195,56;04,0,8417,0407,313;19,6,3503,7792,470;77,6,2194,9308,981;75,2,6228,0783,323;33,3,3359,6388,203;17,6,8284,6905,005,5285;315,4,9043,4951,892,2492;914,7,8830,1168,490,7080;678,9,38883,204,835,7658;598,9,26938,519,632,-3;-0,3,-12,-064,-2,1,-58,-240,7,422,-2,-3,-4;-8,4,-84,-527,3,662,-6,-2,-3,-4,-8,-2,-1,-5,-2;-6,7,-43,-756,-4,7,-15,-119,4,6415;8,25655;-3,3,-41,-261,https://www.nike.com/launch/-6,2,-36,-400,NaN,025480,1,164,302,0,NaN,28551,2,6424034013593,46,06351,34,155,4865,7,4,96990,246954,7,0182443DABC5BFECC1BE9D8AF8813B1A35C20FECDE16016492A8CE2AAA42792A~-2~nUdqB95rTZTeg62j/tuOUmTffzAKYwZlyQfgh7kl4XQ=~-2~-6,3714,233,659596722,89277007-4,7,-15,-112,5,5-0,9,-09,-273,8,3,5,5,35,21,62,1,9,7,2,5,0,762,-4,7,-15,-138,2,1,9,7,3,5,0-7,4,-23,-22,-890762781;dis;,2,8,73;true;true;true;421;true;39;25;true;false;6-1,8,-75,-37,7123-2,6,-07,-868,60019506-4,7,-15,-124,335942-6,3,-95,-302,;2;9;0"
	}; 

	const headers 		= {
		"dnt"				: "1",
		"accept-encoding"	: "gzip, deflate, br",
		"accept-language"	: "en-US,en;q=0.9",
		"user-agent"		: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
		"cccept"			: "*/*",
		"cache-control"		: "max-age=0",
		"connection"		: "keep-alive",
		"content-type"		: "application/json",
		"cookie"			: api_details.preabck,
		"referer"			: "https://www.nike.com/launch/"
	};

	let options = {
		url			: `https://www.nike.com/_bm/_data`,
		gzip		: true,
		headers		: headers,
		method		: "POST",
		resolveWithFullResponse: true,
		jar			: api_details.jar,
		json		: dataString
	};

	api_details.req(options).then(resp => {
        try {
            if (resp.headers["set-cookie"] instanceof Array)
                cookies = resp.headers["set-cookie"].map(Cookie.parse);
            else
                cookies = [Cookie.parse(resp.headers["set-cookie"])];

            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                if (cookie.key === "_abck") {
					log(`[T${api_details.cpuThread}][${api_details.x}] Got abck`, "success");
                }
            }
        } catch (err) {
			log(`[T${api_details.cpuThread}][${api_details.x}] Error Grabbing _abck`, "error");
			nike.acct(api_details);
        }
	})

};

nike.acct = async (api_details) => {
	const headers 		= {
		"DNT"				: "1",
		"Accept-Encoding"	: "gzip, deflate, br",
		"Accept-Language"	: "en-US,en;q=0.9",
		"User-Agent"		: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
		"Accept"			: "*/*",
		"Cache-Control"		: "max-age=0",
		"Connection"		: "keep-alive",
		"Content-type"		: "application/json",
	};

	const domain    = tools.returnRandom(config.emaildomains);
	const LastName  = Fake("{{name.lastName}}");
	const FirstName = Fake("{{name.firstName}}");
	const Password  = `${FirstName}${FirstName}${Math.floor(Math.random() * 10000) + 1}`;
	const dateofbirth = `${tools.randomNumber(1970, 1996)}-${tools.randomNumber(10, 12)}-${tools.randomNumber(10, 30)}`;

	let Email;

    Email       = `${FirstName}${Math.floor(Math.random() * 10000) + 1}@${domain}`;

	const data = {"username":Email,"password":Password,"client_id":"PbCREuPr3iaFANEDjtiEzXooFl7mXGQ7","ux_id":"com.nike.commerce.snkrs.web","grant_type":"password"}

	const options = {
		url     : "https://unite.nike.com/login?appVersion=404&experienceVersion=337&uxid=com.nike.commerce.snkrs.web&locale=en_US&backendEnvironment=identity&browser=Google%20Inc.&os=undefined&mobile=false&native=false&visit=1&visitor=87f17e9e-3bd1-4ae5-97b9-ae013b30db54",
		json    : data,
		headers : headers,
		gzip    : true,
		method  : "POST"
	};

	api_details.req(options).then(body => {
		console.log(body);
	})


};

module.exports = nike;