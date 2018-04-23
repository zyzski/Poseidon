const tools = {};

/* RandNum */ 
tools.returnRandom = (list) =>{
	return list[Math.floor(Math.random() * list.length)]
};

tools.randomNumber = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};



/* STAGING */ 
tools.stagingURL = () => {
	switch (config.locale){
		case "US":
			return `https://adicom:adicom@www.staging.adidas.com/us/apps/yeezy/`;
		case "GB":
			return `https://adicom:adicom@www.staging.adidas.com/us/apps/yeezy/`;
		default:
			return `https://adicom:adicom@www.staging.adidas.com/us/apps/yeezy/`;
	}
};

/* DICTS*/
tools.getSize = (sizeNumber) => {
	let size      	= {};

	/*Infant Sizing*/
	size["1"]		= "280";
	size["1.5"]		= "310";
	size["2"]		= "260";
	size["2.5"]		= "350";
	size["3"]		= "330";

	 /*CLOTHING SIZES*/
	size["XS"]		= "290";
	size["S"]		= "310";
	size["M"]		= "330";
	size["L"]		= "350";
	size["XL"]		= "370";
	size["XXL"]		= "390";

	size["ONE SIZE"]= "500";
	 /*US SHOE SIZES*/
	size["4"]		= "530";
	size["4.5"]		= "540";
	size["5"]		= "550";
	size["5.5"]		= "560";
	size["6"]		= "570";
	size["6.5"]		= "580";
	size["7"]		= "590";
	size["7.5"]		= "600";
	size["8"]		= "610";
	size["8.5"]		= "620";
	size["9"]		= "630";
	size["9.5"]		= "640";
	size["10"]		= "650";
	size["10.5"]	= "660";
	size["11"]		= "670";
	size["11.5"]	= "680";
	size["12"]		= "690";
	size["12.5"]	= "700";
	size["13"]		= "710";
	size["13.5"]	= "720";
	size["14"]		= "730";
	size["14.5"]	= "740";
	size["15"]		= "750";
	size["16"]		= "760";
	size["17"]		= "780";
	size["18"]		= "790";
	size["19"]		= "800";
	size["20"]		= "810";	

	/* EU */ 
	size["36"] 			= "530";
	size["36 2/3"] 		= "540";
	size["37 1/3"] 		= "550";
	size["38"] 			= "560";
	size["38 2/3"] 		= "570";
	size["39 1/3"] 		= "580";
	size["40"] 			= "590";
	size["40 2/3"] 		= "600";
	size["41 1/3"] 		= "610";
	size["42"] 			= "620";
	size["42 2/3"] 		= "630";
	size["43 1/3"] 		= "640";
	size["44"] 			= "650";
	size["44 2/3"] 		= "660";
	size["45 1/3"] 		= "670";
	size["46"] 			= "680";
	size["46 2/3"] 		= "690";
	size["47 1/3"] 		= "700";
	size["48"] 			= "710";
	size["48 2/3"] 		= "720";
	size["49 1/3"] 		= "730";
	/* EU */ 

	return (config.locale === "GB") ? parseInt(size[sizeNumber]) +10 : size[sizeNumber]
};


tools.reverseSize = (sizeNumber) => {
	const size 			= {}; 
	size["36"] 			= "4"
	size["36 2/3"] 		= "4.5"
	size["37 1/3"] 		= "5"
	size["38"] 			= "5.5"
	size["38 2/3"] 		= "6"
	size["39 1/3"] 		= "6.5"
	size["40"] 			= "7"
	size["40 2/3"] 		= "7.5"
	size["41 1/3"] 		= "8"
	size["42"] 			= "8.5"
	size["42 2/3"] 		= "9"
	size["43 1/3"] 		= "9.5"
	size["44"] 			= "10"
	size["44 2/3"] 		= "10.5"
	size["45 1/3"] 		= "11"
	size["46"] 			= "11.5"
	size["46 2/3"] 		= "12"
	size["47 1/3"] 		= "12.5"
	size["48"] 			= "13"
	size["48 2/3"] 		= "13.5"
	size["49 1/3"] 		= "14"

	return size[sizeNumber];
}; 

tools.getLocale = (store_code) => {
	const locale = {
		"AU": ["com.au"	, "en_AU"],
		"DE": ["de"		, "de_DE"],
		"ES": ["es"		, "es_ES"],
		"IT": ["it"		, "it_IT"],
		"NZ": ["co.nz"	, "en_NZ"],
		"US": ["com"	, "en_US"],
		"CA": ["ca"		, "en_US"],
		"MX": ["mx"		, "en_US"],
		"GB": ["co.uk"	, "en_GB"],
		"FR": ["fr"		, "fr_FR"],
		"IT": ["it"		, "it_IT"],
		"RU": ["ru"		, "ru_RU"],
		"SE": ["se"		, "sv_SE"],
		"RU": ["ru"		, "ru_RU"],
		"CH": ["ch"		, "de_CH"],
		"NL": ["nl"		, "nl_NL"],
	}; 
	return locale[store_code.toUpperCase()]
};

/* DICTS*/

module.exports = tools; 