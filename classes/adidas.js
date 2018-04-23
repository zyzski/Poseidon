const tools 	= require("./tools");
const faker 	= require("faker");
const moment 	= require("moment");
const request 	= require("request-promise");
const cheerio 	= require("cheerio");
const chalk		= require("chalk");
const Slack 	= require("slack");
const bot 		= new Slack();
const Fake 		= faker.fake;
const adidas 	= {};
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
/* Magic */

adidas.main = async (x, cpuThread, restart) => {
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
	if (config.splash.isSplash) {
		adidas.splash(api_details);
	} else {
		adidas.getabck(api_details);
		//setTimeout(adidas.dynamicSize, tools.randomNumber(1500, 2000), api_details);
	}

	// if (!config.sizes.length) {
	// 	adidas.dynamicSize(api_details);
	// }
};


adidas.splash = async (api_details) => {

    api_details.jar.setCookie(`HRPYYU=true; path=/; domain=www.adidas.${tools.getLocale(config.locale)[0]}`, `http://www.adidas.${tools.getLocale(config.locale)[0]}`);

    //api_details.jar.setCookie("HRPYYU=true; path=/; domain=cartchefs-simulator.herokuapp.com", "http://cartchefs-simulator.herokuapp.com");

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
		url		: api_details.splashURL,
		headers	: headers,
		jar		: api_details.jar,
		gzip	: true,
		resolveWithFullResponse: true
    };
    
    api_details.req(options).then(resp => {
        if (resp.body.includes("wrgen")) {
			log(`[T${api_details.cpuThread}][${api_details.x}] Passed splash`, "success");
            try {
                if (resp.headers["set-cookie"] instanceof Array)
                    cookies = resp.headers["set-cookie"].map(function(c) {
                    return (Cookie.parse(c));
                    });
                else
                    cookies = [Cookie.parse(resp.headers["set-cookie"])];

                for (let x = 0; x < cookies.length; x++) {
                    const cookie = cookies[x];
                    if (cookie.key.includes("gceeqs")) {
                        
                        api_details.hmac_set = true;
						log(`[T${api_details.cpuThread}][${api_details.x}] HMAC: ${cookie.value}`, "info");
                        const cookieString = `${cookie.key}=${cookie.value}; path=${cookie.path}; maxAge=${cookie.maxAge}; domain=.${cookie.domain}; expires=${cookie.expires};`;
                        api_details.gceeqs = `${cookie.key}=${cookie.value};`;
						api_details.jar.setCookie(`${cookie.key}=${cookie.value}; path=${cookie.path}; domain=${cookie.domain}`, `https://www.adidas.${tools.getLocale(config.locale)[0]}`);
						adidas.sendToSlack2(api_details);
						adidas.get_shoe(api_details);
						adidas.getabck(api_details);
						adidas.get_akacd(api_details);
                		//setTimeout(adidas.dynamicSize, tools.randomNumber(1500, 2000), api_details);

                    }
                }
            } catch (err) {
				log(err);
                api_details.gceeqs = null;
                log(`[T${api_details.cpuThread}][${api_details.x}] HMAC: ${api_details.gceeqs}`, "error");
                adidas.get_shoe(api_details);
                setTimeout(adidas.dynamicSize, tools.randomNumber(1500, 2000), api_details);
            }
        } else {
            log(`[T${api_details.cpuThread}][${api_details.x}] In splash`, "lightgray");
            setTimeout(adidas.splash, tools.randomNumber(1500, 2000), api_details);
        }
    })
};

adidas.dynamicSize = async (api_details) => {
	config.splash.Size.clear();

	if (config.debug) {
		console.log(api_details.stockURL);
    }

	if (api_details.amount_scrape === 0) {
        if (config.debug) {
		    log(`[T${api_details.cpuThread}][${api_details.x}] Random Size Mode.`, "info");
        }
        api_details.amount_scrape++;
	}
	let headers = {
		"DNT"					: "1",
		"Accept-Encoding"		: "gzip, deflate, br",
		"Accept-Language"		: "en-US,en;q=0.8",
		"Upgrade-Insecure-Requests": "1",
		"User-Agent"			: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
		"Cache-Control"			: "max-age=0",
		"Connection"			: "keep-alive",
	};

	let options = {
		url		: api_details.stockURL,
		headers	: headers,
		json	: true,
		gzip	: true
	};

	let sizeArray 	= [];
	let sizeStr 	= "";
	let status 		= undefined;

	api_details.req(options).then(body => {
		body = body.sizes;
		status = (!body.length) ? "NOT_LOADED" : undefined;
		for (let i = 0; i < body.length; i++) {
			const size = body[i];

			if (size.status === "IN_STOCK") {
				sizeArray.push(size.literalSize);
				sizeStr += `${size.literalSize} | `;
				config.splash.Size.push(size.literalSize)
			} else if (size.status === "PREVIEW") {
				status = size.status;
			}
		}

		if (sizeArray.length) {
			if (config.debug) {
				log(`[T${api_details.cpuThread}][${api_details.x}] Sizes in stock: ${sizeStr}`, "success");
			}
            adidas.addToCartOptions(api_details);
            adidas.addToCart(api_details);
		} else {
			if (status === "PREVIEW") {
				log(`[T${api_details.cpuThread}][${api_details.x}] Sizes still in preview...`, "info");
			} else if (status === "NOT_LOADED") {
				log(`[T${api_details.cpuThread}][${api_details.x}] Sizes not loaded.`, "error");
			} else {
				log(`[T${api_details.cpuThread}][${api_details.x}] All sizes are out of stock.`, "error");
			}
			setTimeout(adidas.dynamicSize, tools.randomNumber(1000, 1500), api_details);
		}

	}).catch(err => {
		console.log(err);
		setTimeout(adidas.dynamicSize, tools.randomNumber(1000, 1500), api_details);
	})
};

adidas.get_akacd = async (api_details) => {
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
		url		: `https://www.adidas.${tools.getLocale(config.locale)[0]}/service-worker.js`,
		headers	: headers,
		jar		: api_details.jar,
		resolveWithFullResponse: true,
		json	: true,
		simple	: false,
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
			if (cookie.key === "akacd_phasedRC_Row") {
				log("akacd grabbed")
			}
		}
	} catch (e) {
        log(`[T${api_details.cpuThread}][${api_details.x}] Error Grabbing akacd`, "error");
	}

};

adidas.get_shoe = async (api_details) => {
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
		url		: api_details.searchURL,
		headers	: headers,
		jar		: api_details.jar,
		resolveWithFullResponse: true,
		json	: true,
		simple	: false,
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
			}
		}
	} catch (e) {
        log(`[T${api_details.cpuThread}][${api_details.x}] Error Grabbing BM`, "error");
	}
};

adidas.getabck = async (api_details) => {
	try {
		const reply             = await sensorDB.randomkeyAsync(); 
		if (reply === null){
			log(`[T${api_details.cpuThread}][${api_details.x}] Waiting for sensor data`, "info");
			setTimeout(adidas.getabck, tools.randomNumber(500, 1251), api_details); 
		} else {
			const data          = await sensorDB.getAsync(reply); 
			const sensorKey    = data.toString();
			log(`[T${api_details.cpuThread}][${api_details.x}] Sensor Data: ${sensorKey.substr(0, 20)}`, "yellow");
			const delKey        = await sensorDB.delAsync(reply); 
			log(`[T${api_details.cpuThread}][${api_details.x}] Deleted data Successfully`, "info");
			api_details.dataString 	= {"sensor_data":sensorKey};
			setTimeout(adidas.abck, tools.randomNumber(500, 1251), api_details);
		}
	} catch (e) {
			setTimeout(adidas.getabck, tools.randomNumber(500, 1251), api_details);
		}


};

adidas.abck = async (api_details) => {
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

	let options = {
		url     : "https://www.footlocker.com",
		jar     : api_details.jar,
		gzip    : true,
		headers : headers,
		method  : "GET"
	};

	api_details.req(options).then(body => {
		let jarcookies = api_details.jar.getCookies(`https://www.footlocker.com`);
		let cookie = request.cookie(`${jarcookies.key}=${jarcookies.value}`);
		log("#1");
	
		const headers 		= {
			"DNT"				: "1",
			"Accept-Encoding"	: "gzip, deflate, br",
			"Accept-Language"	: "en-US,en;q=0.9",
			"User-Agent"		: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
			"Accept"			: "*/*",
			"Connection"		: "keep-alive",
			"Content-type"		: "application/json",
			"Host": "www.footlocker.com",
			"Origin": "https://www.footlocker.com",
			"Referer": "https://www.footlocker.com/ns/common/fpc/fpcset.html?dtm_token=AQEKQJ_eBiCLswEBAQEAAQEJrgE",
			"Cookie": `${cookie}`

		};

		let options = {
			url			: `http://www.adidas.co.uk/_bm/_data`,
			gzip		: true,
			headers		: headers,
			method		: "POST",
			resolveWithFullResponse: true,
			jar			: api_details.jar,
			json		: api_details.dataString
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
						if (cookie.value.includes("~0~")) {
							log("verified")
							api_details.abck = `${cookie.key}=${cookie.value};`
							api_details.jar.setCookie(`${cookie.key}=${cookie.value}; path=/; domain=www.adidas.${tools.getLocale(config.locale)[0]}`, `http://www.adidas.${tools.getLocale(config.locale)[0]}`);
							setTimeout(adidas.dynamicSize, tools.randomNumber(1500, 2000), api_details);
						} else {
							setTimeout(adidas.abck, tools.randomNumber(1500, 2000), api_details);
						}
					}
				}
			} catch (err) {
				log(`[T${api_details.cpuThread}][${api_details.x}] Error Grabbing _abck`, "error");
				setTimeout(adidas.main, 100, api_details.x, api_details.cpuThread, true);
			}
		})
	})
};	

adidas.addToCartOptions = async (api_details) => {
	if (config.splash.Size.length){
		const size 				= tools.returnRandom(config.splash.Size);
		api_details.atc_size 	= size;
		
		if (!config.use_captcha) {
			if (!config.oldAPI) {
				api_details.atc_data = {
					"product_id"            : `${api_details.pid}`,
					"quantity"              : 1,
					"product_variation_sku" : `${api_details.pid}_${tools.getSize(size)}`,
					"size"                  : size,
					"recipe"                : null,
					"legacy_recipe"         : null,
					"invalidFields"         : [],
					"isValidating"          : false,
					"clientCaptchaResponse" : ""
				}; 
			} else {
				api_details.atc_data = {
					"masterPid"            	: `${api_details.pid}`,
					"Quantity"              : 1,
					"pid" 					: `${api_details.pid}_${tools.getSize(size)}`,
					"responseformat"		: `json`
				};
			}
		} else {
			try {
				const reply             = await captchaDB.randomkeyAsync(); 
				if (reply === null){
					log(`[T${api_details.cpuThread}][${api_details.x}] Waiting for cap token`, "info");
					setTimeout(adidas.addToCartOptions, tools.randomNumber(500, 1251), api_details); 
				} else {
					const data          = await captchaDB.getAsync(reply); 
					const captchaKey    = data.toString();
					log(`[T${api_details.cpuThread}][${api_details.x}] Captcha Token: ${captchaKey.substr(0, 20)}`, "yellow");
					const delKey        = await captchaDB.delAsync(reply); 
					log(`[T${api_details.cpuThread}][${api_details.x}] Deleted key Successfully`, "info");
					if (!config.oldAPI) {
						api_details.atc_data = {
							"product_id"            :`${api_details.pid}`,
							"quantity"              :1,
							"product_variation_sku" :`${api_details.pid}_${tools.getSize(size)}`,
							"size"                  :size,
							"recipe"                :null,
							"legacy_recipe"         :null,
							"invalidFields"         :[],
							"isValidating"          :false,
							"clientCaptchaResponse" :`${captchaKey}`
						}; 
					} else {
						api_details.atc_data = {
							"masterPid"            	: `${api_details.pid}`,
							"Quantity"              : 1,
							"pid" 					: `${api_details.pid}_${tools.getSize(size)}`,
							"responseformat"		: `json`,
							"g-recaptcha-response"	: `${captchaKey}`,
							"layer"					: `Add To Bag overlay`,
							"ajax"					: `true`

						};
					}
				}
			} catch (e) {
				setTimeout(adidas.addToCartOptions, tools.randomNumber(500, 1251), api_details);

			}
		}
	} else {
		if (tools.randomNumber(100, 10000) < 100 || api_details.inital_warning === undefined){
			log(`[T${api_details.cpuThread}][${api_details.x}][${api_details.pid}] Waiting for sizes....`, "error");
			api_details.inital_warning = true; 
		}
		setTimeout(adidas.addToCartOptions, tools.randomNumber(5, 100), api_details);
	}
};

adidas.addToCart = async (api_details) => {
	if (api_details.atc_data) {
		const headers = {
			"DNT"               : "1",
			"Accept-Encoding"   : "gzip, deflate, br",
			"Accept-Language"   : "en-US,en;q=0.9",
			"User-Agent"        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
			"Accept"            : "*/*",
			"Connection"        : "keep-alive",
			"Host"              : `www.adidas.${tools.getLocale(config.locale)[0]}`,
			"Origin"            : `https://www.adidas.${tools.getLocale(config.locale)[0]}`,
			"Content-Type"      : "application/x-www-form-urlencoded; charset=UTF-8",
			"Cookie"            : `${api_details.gceeqs} ${api_details.jar.getCookieString(`http://www.adidas.${tools.getLocale(config.locale)[0]}`)}`,
			"Referer"			: `https://www.adidas.co.uk/on/demandware.store/Sites-adidas-GB-Site/en_US/Product-Show?pid=%20DB2908`
		};

		let atcURL; 
		let options; 


		switch (config.oldAPI) {
			case true: 
				atcURL 	= `https://www.adidas.${tools.getLocale(config.locale)[0]}/on/demandware.store/Sites-adidas-${config.locale}-Site/en_${config.locale}/Cart-MiniAddProduct`;
				options = {
					url     : atcURL,
					jar     : api_details.jar,
					gzip    : true,
					headers : headers,
					method  : "POST",
					form	: api_details.atc_data
				};
				break; 
			
			case false:
				atcURL 	= `https://www.adidas.${tools.getLocale(config.locale)[0]}/api/cart_items`;
				options = {
					url     : atcURL,
					jar     : api_details.jar,
					gzip    : true,
					headers : headers,
					method  : "POST",
					json    : api_details.atc_data,
					followAllRedirects: true
				};
				break;
		}
		api_details.req(options).then(resp => {
			log(resp);
			api_details.carted_time = Date.now() / 1000;
			if (config.oldAPI) {

				let headers = {
					'DNT': '1',
					'Accept-Encoding': 'gzip, deflate, br',
					'Accept-Language': 'en-US,en;q=0.9',
					'Upgrade-Insecure-Requests': '1',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					'Cache-Control': 'max-age=0',
					'Connection': 'keep-alive'
				};
			
				let productURL = `https://www.adidas.${tools.getLocale(config.locale)[0]}/on/demandware.store/Sites-adidas-${config.locale}-Site/default/Cart-ProductCount`;

				let options = {
					url:productURL,
					jar:api_details.jar,
					gzip:true,
					headers:headers
				};
		
				api_details.req(options).then(body => {
					if (body.includes("1")) {
						log(`[T${api_details.cpuThread}][${api_details.x}] Successfully Carted: ${chalk.red(api_details.pid)}`, "success");
						adidas.createAccount(api_details);
						adidas.prelogin(api_details)
					} else {
						log(`[T${api_details.cpuThread}][${api_details.x}] Failed To Cart (${body})`, "error");
						api_details.atc_data = undefined;
						setTimeout(adidas.addToCart, tools.randomNumber(5, 100), api_details);
						setTimeout(adidas.addToCartOptions, tools.randomNumber(5, 100), api_details);
					}
				})
			}
		}).catch(err => {
			log(`[T${api_details.cpuThread}][${api_details.x}] ${err.message}`, "error");
			api_details.atc_data = undefined;
			setTimeout(adidas.main, 100, api_details.x, api_details.cpuThread, true);
			// setTimeout(adidas.addToCart, tools.randomNumber(500, 1000), api_details);
			// setTimeout(adidas.addToCartOptions, tools.randomNumber(500, 1000), api_details);
		});

	} else {
		setTimeout(adidas.addToCart, tools.randomNumber(5, 100), api_details);
	}

};

adidas.createAccount = async (api_details) => {
	const domain    = tools.returnRandom(config.emaildomains);
	const LastName  = Fake("{{name.lastName}}");
	const FirstName = Fake("{{name.firstName}}");
	const Password  = `${FirstName}${FirstName}${Math.floor(Math.random() * 10000) + 1}`;
	const dateofbirth = `${tools.randomNumber(1970, 1996)}-${tools.randomNumber(10, 12)}-${tools.randomNumber(10, 30)}`;
	const headers   = {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36"
	};

	let Email;

    Email       = `${FirstName}${Math.floor(Math.random() * 10000) + 1}@${domain}`;

	const data = {
		"clientId"      : "1ffec5bb4e72a74b23844f7a9cd52b3d",
		"actionType"    : "REGISTRATION",
		"email"         : Email,
		"password"      : Password,
		"countryOfSite" : config.locale,
		"dateOfBirth"   : dateofbirth,
		"minAgeConfirmation": "Y",
		"firstName"     : FirstName,
		"lastName"      : LastName
	};

	const createAccountURL = "https://apim.scv.3stripes.net/scvRESTServices/account/createAccount";


	const options = {
		url     : createAccountURL,
		body    : data,
		headers : headers,
		gzip    : true,
		method  : "POST",
		json    : true
	};


	api_details.req(options).then(body => {
		if (body.conditionCode === ("iCCD_CRT_ACCT_0001")) {
			log(`[T${api_details.cpuThread}][${api_details.x}] Successfully Created account | (${Email})`, "success");

			api_details.accountDetails = {
				"email"     : Email,
				"password"  : Password,
				"size"      : api_details.atc_size
			};
			adidas.login(api_details);
		}
	}).catch(err => {
		console.log(err);
		setTimeout(adidas.createAccount, 1500, api_details);
	});
};


adidas.prelogin = async (api_details) => {
	const headers = {
		"DNT"               : "1",
		"Accept-Encoding"   : "gzip, deflate, br",
		"Accept-Language"   : "en-US,en;q=0.9",
		"Upgrade-Insecure-Requests": "1",
		"User-Agent"        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.71 Safari/537.36",
		"Accept"            : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		"Connection"        : "keep-alive",
	};

	const signInUrl = `https://www.adidas.${tools.getLocale(config.locale)[0]}/on/demandware.store/Sites-adidas-${config.locale}-Site/en_${config.locale}/MiAccount-Login/`;
	const options   = {
		url     : signInUrl,
		jar     : api_details.jar,
		method  : "GET",
		headers : headers,
		gzip    : true
	};

	api_details.req(options).then(body => {
		let $           = cheerio.load(body); 
		let form_action = $("form[id=dwfrm_milogin]").attr("action");
		let secureKey   = $("input[name=dwfrm_milogin_securekey]").attr("value");
		if (form_action !== undefined && secureKey !== undefined) {
			api_details.loginDetails = {
				"loginURL"  : form_action,
				"secureKey" : secureKey
			}; 
		} else {
			console.log("undefined"); 
		}
	}).catch(err => {
		console.log(err);
		setTimeout(adidas.prelogin, 1500, api_details);
	});
};

adidas.login = async (api_details) => {
	if (api_details.loginDetails) {
		const headers = {
            "Content-Type"      : "application/x-www-form-urlencoded",
			"Accept-Encoding"   : "gzip, deflate, br",
			"Accept-Language"   : "en-US,en;q=0.9",
			"Upgrade-Insecure-Requests": "1",
			"User-Agent"        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.71 Safari/537.36",
			"Accept"            : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Connection"        : "keep-alive",
            "Referer"           : api_details.loginDetails.loginURL
		};

		const data = {
			"dwfrm_milogin_username"    : api_details.accountDetails.email,
			"dwfrm_milogin_password"    : api_details.accountDetails.password,
			"dwfrm_milogin_milogin"     : "Sign in",
			"dwfrm_milogin_securekey"   : api_details.loginDetails.secureKey
		};

		let options = {
			jar     : api_details.jar,
			url     : api_details.loginDetails.loginURL,
			method  : "POST",
			headers : headers,
			form    : data,
			gzip    : true
		};

		api_details.req(options).then(body => {
			if (body.includes("MiAccount-Redirect?justRegistered=false&redirect=")) {
				log(`[T${api_details.cpuThread}][${api_details.x}] Successfully logged in		| ${api_details.accountDetails.email}`, "success");
				if (config.sellAPI.isChef) {
					adidas.uploadCartChef(api_details);
				} else {
					adidas.sendToSlack(api_details);
				}
			} else {
				console.log(body)
			}
		}).catch(err => {
			console.log(err);
			setTimeout(adidas.login, tools.randomNumber(500, 1000), api_details);
		})
	} else {
		setTimeout(adidas.login, tools.randomNumber(5, 100), api_details);
	}
};


adidas.sendToSlack = async (api_details) => {
    const flag  = `:flag-${config.locale}:`;
    
    const headers = {
		"DNT"               : "1",
		"Accept-Encoding"   : "gzip, deflate, br",
		"Accept-Language"   : "en-US,en;q=0.9",
		"Upgrade-Insecure-Requests": "1",
		"User-Agent"        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.71 Safari/537.36",
		"Accept"            : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		"Connection"        : "keep-alive",
    };
    
	let options = {
		url     : "https://www.adidas." + tools.getLocale(config.locale)[0] + "/on/demandware.store/Sites-adidas-" + config.locale + "-Site/" + tools.getLocale(config.locale)[1] + "/Cart-ProductCount",
		method  : "GET",
        jar     : api_details.jar,
        headers : headers,
		gzip    : true
	};

	api_details.req(options).then(body => {
		if (body.includes("1")) {
			let loginUrl    = `https://cp.adidas.${tools.getLocale(config.locale)[0]}/idp/startSSO.ping?username=${api_details.accountDetails["email"]}&password=${api_details.accountDetails["password"]}&signinSubmit=Sign+in&IdpAdapterId=adidasIdP10&SpSessionAuthnAdapterId=https%3A%2F%2Fcp.adidas.com%2Fweb%2F&PartnerSpId=sp%3Ademandware&validator_id=adieComDWgb&TargetResource=https%3A%2F%2Fwww.adidas.${tools.getLocale(config.locale)[0]}%2Fon%2Fdemandware.store%2FSites-adidas-${(config.locale.toUpperCase())}-Site%2F${tools.getLocale(config.locale)[1]}%2FMyAccount-ResumeLogin%3Ftarget%3Daccount%26target%3Daccount&InErrorResource=https%3A%2F%2Fwww.adidas.${tools.getLocale(config.locale)[0]}%2Fon%2Fdemandware.store%2FSites-adidas-${(config.locale.toUpperCase())}-Site%2Fen_AU%2Fnull&loginUrl=https%3A%2F%2Fcp.adidas.${tools.getLocale(config.locale)[0]}%2Fweb%2FeCom%2F${tools.getLocale(config.locale)[1]}%2Floadsignin&cd=eCom%7C${tools.getLocale(config.locale)[1]}%7Ccp.adidas.${tools.getLocale(config.locale)[0]}%7Cnull&remembermeParam=&app=eCom&locale=${tools.getLocale(config.locale)[1]}&domain=cp.adidas.${tools.getLocale(config.locale)[0]}&email=&pfRedirectBaseURL_test=https%3A%2F%2Fcp.adidas.${tools.getLocale(config.locale)[0]}&pfStartSSOURL_test=https%3A%2F%2Fcp.adidas.${tools.getLocale(config.locale)[0]}%2Fidp%2FstartSSO.ping&resumeURL_test=&FromFinishRegistraion=&CSRFToken=ad1a5646-1eec-4180-91a5-09a339f305e9`;
			let attachment  = [{
				"fallback"  : `${api_details.accountDetails.size} | ${api_details.pid} ${flag}`,
				"color"     : "#36a64f",
				"title"     : `Size: ${api_details.accountDetails.size} | ${flag} `,
				"title_link": loginUrl,
				"fields"    : [{
					title   : `Account Info`,
					value   : `<${loginUrl} | ${api_details.accountDetails["email"]}:${api_details.accountDetails["password"]}>`,
					short   : true
				}],
				"thumb_url" : `http://demandware.edgesuite.net/sits_pod20-adidas/dw/image/v2/aaqx_prd/on/demandware.static/-/Sites-adidas-products/en_US/dw8b928257/zoom/${api_details.pid}_01_standard.jpg?sw=500&sfrm=jpg`,
				"footer"    : `Poseidon Cart Notification`,
				"footer_icon": `https://vignette.wikia.nocookie.net/playstationallstarsbattleroyale/images/f/f4/Poseidon_-_Ascension.jpg/revision/latest?cb=20130320183916`,
				"ts"        : Date.now() / 1000

			}];

			bot.chat.postMessage({
				as_user     : false,
				icon_url    : "https://vignette.wikia.nocookie.net/playstationallstarsbattleroyale/images/f/f4/Poseidon_-_Ascension.jpg/revision/latest?cb=20130320183916",
				token       : config.notificationAPI.slack.apiKey,
				channel     : config.notificationAPI.slack.channel,
				username    : config.notificationAPI.slack.botName,
				text        : "",
				attachments : attachment
			}).then(log(`[T${api_details.cpuThread}][${api_details.x}] Sent to slack`, "success")
		).catch(err => {});
			setTimeout(adidas.main, 100, api_details.x, api_details.cpuThread, true);
		} else {
			console.log(body);
			setTimeout(adidas.sendToSlack, 1500, api_details);
		}
	}).catch(err => {
		console.log(err);
		setTimeout(adidas.sendToSlack, 1500, api_details);
	})
};

adidas.sendToSlack2 = async (api_details) => {
	const flag  = `:flag-${config.locale}:`;
			let attachment  = [{
				"fallback"  : `Passed Splash | ${flag}`,
				"color"     : "#36a64f",
				"title"     : `Passed Splash | ${flag} `,
				"fields"    : [{
                    title   : `HMAC`,
					value   : `${api_details.gceeqs}`,
					short   : false
                }],
				"thumb_url" : `http://demandware.edgesuite.net/sits_pod20-adidas/dw/image/v2/aaqx_prd/on/demandware.static/-/Sites-adidas-products/en_US/dw8b928257/zoom/${api_details.pid}_01_standard.jpg?sw=500&sfrm=jpg`,
				"footer"    : `Poseidon Splash Notification`,
				"footer_icon": `https://vignette.wikia.nocookie.net/playstationallstarsbattleroyale/images/f/f4/Poseidon_-_Ascension.jpg/revision/latest?cb=20130320183916`,
				"ts"        : Date.now() / 1000

			}];

			bot.chat.postMessage({
				as_user     : false,
				icon_url    : "https://vignette.wikia.nocookie.net/playstationallstarsbattleroyale/images/f/f4/Poseidon_-_Ascension.jpg/revision/latest?cb=20130320183916",
				token       : config.notificationAPI.slack.apiKey,
				channel     : "poseidon-splashnotif",
				username    : config.notificationAPI.slack.botName,
				text        : "",
				attachments : attachment
			}).then();
};

module.exports = adidas;

