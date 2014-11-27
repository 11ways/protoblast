module.exports = function BlastUserAgent(Blast, Collection) {

	/**
	 * Perform regex matches on a ua string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.4
	 * @version  0.1.4
	 *
	 * @param    {String}   ua
	 *
	 * @return   {Object}
	 */
	function matchUA(ua) {

		var platform_match,
		    platform,
		    browser,
		    version,
		    major,
		    minor,
		    patch,
		    match,
		    temp;

		ua = ua.toLowerCase();

		match = /(edge)\/([\w.]+)/.exec(ua) ||
			/(opr)[\/]([\w.]+)/.exec(ua) ||
			/(chrome)[ \/]([\w.]+)/.exec(ua) ||
			/(version)(applewebkit)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) ||
			/(webkit)[ \/]([\w.]+).*(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(ua) ||
			/(webkit)[ \/]([\w.]+)/.exec(ua) ||
			/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
			/(msie) ([\w.]+)/.exec(ua) ||
			ua.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(ua) ||
			ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
			[];

		console.log(match)

		platform_match = /(ipad)/.exec( ua ) ||
			/(iphone)/.exec(ua) ||
			/(android)/.exec(ua) ||
			/(windows phone)/.exec(ua) ||
			/(win)/.exec(ua) ||
			/(mac)/.exec(ua) ||
			/(linux)/.exec(ua) ||
			/(cros)/.exec(ua) ||
			[];

		platform = platform_match[ 0 ] || '';
		browser = match[ 5 ] || match[ 3 ] || match[ 1 ] || '';
		version = match[ 2 ] || match[ 4 ] || '0';

		if (browser == 'mozilla' && ua.indexOf('firefox/') > -1) {
			browser = 'firefox';
		}

		temp = version.split('.');

		major = temp[0] || '0';
		minor = temp[1] || '0';
		patch = temp[2] || '0';

		return {
			browser: browser,
			version: version,
			versionNumber: match[ 4 ] || match[ 2 ] || '0',
			platform: platform,
			major: major,
			minor: minor,
			patch: patch
		};
	}

	Blast.test = matchUA;
};

return;
var nVer = navigator.appVersion;
var nAgt = navigator.userAgent;
var browserName  = navigator.appName;
var fullVersion  = ''+parseFloat(navigator.appVersion); 
var majorVersion = parseInt(navigator.appVersion,10);
var nameOffset,verOffset,ix;

// In Opera 15+, the true version is after "OPR/" 
if ((verOffset=nAgt.indexOf("OPR/"))!=-1) {
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+4);
}
// In older Opera, the true version is after "Opera" or after "Version"
else if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
 browserName = "Opera";
 fullVersion = nAgt.substring(verOffset+6);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In MSIE, the true version is after "MSIE" in userAgent
else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
 browserName = "Microsoft Internet Explorer";
 fullVersion = nAgt.substring(verOffset+5);
}
// In Chrome, the true version is after "Chrome" 
else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
 browserName = "Chrome";
 fullVersion = nAgt.substring(verOffset+7);
}
// In Safari, the true version is after "Safari" or after "Version" 
else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
 browserName = "Safari";
 fullVersion = nAgt.substring(verOffset+7);
 if ((verOffset=nAgt.indexOf("Version"))!=-1) 
   fullVersion = nAgt.substring(verOffset+8);
}
// In Firefox, the true version is after "Firefox" 
else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
 browserName = "Firefox";
 fullVersion = nAgt.substring(verOffset+8);
}
// In most other browsers, "name/version" is at the end of userAgent 
else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < 
          (verOffset=nAgt.lastIndexOf('/')) ) 
{
 browserName = nAgt.substring(nameOffset,verOffset);
 fullVersion = nAgt.substring(verOffset+1);
 if (browserName.toLowerCase()==browserName.toUpperCase()) {
  browserName = navigator.appName;
 }
}
// trim the fullVersion string at semicolon/space if present
if ((ix=fullVersion.indexOf(";"))!=-1)
   fullVersion=fullVersion.substring(0,ix);
if ((ix=fullVersion.indexOf(" "))!=-1)
   fullVersion=fullVersion.substring(0,ix);

majorVersion = parseInt(''+fullVersion,10);
if (isNaN(majorVersion)) {
 fullVersion  = ''+parseFloat(navigator.appVersion); 
 majorVersion = parseInt(navigator.appVersion,10);
}