module.exports = function BlastDiacritics(Blast, Collection) {

	var baseDiacriticsMap,
	    allCombiningMarks,
	    diacriticsMap = {},
	    japaneseList,
	    japaneseMap,
	    diacritics,
	    hebrewList,
	    sortList,
	    Bound = Blast.Bound,
	    base,
	    i;

	/**
	 * A sort function for language map arrays
	 */
	sortList = function sortList(a, b) {
		return b.original.length - a.original.length;
	}

	/**
	 * A map of all letters and their possible accented counterparts
	 *
	 * @link http://stackoverflow.com/questions/990904/javascript-remove-accents-in-strings
	 *
	 * @type   {Object}
	 */
	baseDiacriticsMap = {
		A: '\u24B6\uFF21\xC0\xC1\xC2\u1EA6\u1EA4\u1EAA\u1EA8\xC3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\xC4\u01DE\u1EA2\xC5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F',
		AA: '\uA732',
		AE: '\xC6\u01FC\u01E2',
		AO: '\uA734',
		AU: '\uA736',
		AV: '\uA738\uA73A',
		AY: '\uA73C',
		B: '\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181',
		C: 'C\u24B8\uFF23\u0106\u0108\u010A\u010C\xC7\u1E08\u0187\u023B\uA73E',
		D: 'D\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779',
		DZ: '\u01F1\u01C4',
		Dz: '\u01F2\u01C5',
		E: '\u24BA\uFF25\xC8\xC9\xCA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\xCB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E',
		F: '\u24BB\uFF26\u1E1E\u0191\uA77B',
		G: '\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E',
		H: '\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D',
		I: '\u24BE\uFF29\xCC\xCD\xCE\u0128\u012A\u012C\u0130\xCF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197',
		J: '\u24BF\uFF2A\u0134\u0248',
		K: '\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2',
		L: '\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780',
		LJ: '\u01C7',
		Lj: '\u01C8',
		M: '\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C',
		N: '\u24C3\uFF2E\u01F8\u0143\xD1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4',
		NJ: '\u01CA',
		Nj: '\u01CB',
		O: '\u24C4\uFF2F\xD2\xD3\xD4\u1ED2\u1ED0\u1ED6\u1ED4\xD5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\xD6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\xD8\u01FE\u0186\u019F\uA74A\uA74C',
		OI: '\u01A2',
		OO: '\uA74E',
		OU: '\u0222',
		P: '\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754',
		Q: '\u24C6\uFF31\uA756\uA758\u024A',
		R: '\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782',
		S: '\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784',
		T: '\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786',
		TZ: '\uA728',
		U: '\u24CA\uFF35\xD9\xDA\xDB\u0168\u1E78\u016A\u1E7A\u016C\xDC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244',
		V: '\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245',
		VY: '\uA760',
		W: '\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72',
		X: '\u24CD\uFF38\u1E8A\u1E8C',
		Y: '\u24CE\uFF39\u1EF2\xDD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE',
		Z: '\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762',
		a: '\u24D0\uFF41\u1E9A\xE0\xE1\xE2\u1EA7\u1EA5\u1EAB\u1EA9\xE3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\xE4\u01DF\u1EA3\xE5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250\xAA\u1D2C\u1D43\u2090\u2100\u2101\u213B\u249C\u3371\u3374\u3380\u3384\u33A9\u33AF\u33C2\u33CA\u33DF\u33FF',
		aa: '\uA733',
		ae: '\xE6\u01FD\u01E3',
		ao: '\uA735',
		au: '\uA737',
		av: '\uA739\uA73B',
		ay: '\uA73D',
		b: '\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253\u1D2E\u1D47\u212C\u249D\u3374\u3385\u3387\u33C3\u33C8\u33D4\u33DD',
		c: '\u24D2\uFF43\u0107\u0109\u010B\u010D\xE7\u1E09\u0188\u023C\uA73F\u2184\u1D9C\u2100\u2102\u2103\u2105\u2106\u212D\u216D\u217D\u249E\u3376\u339D\u33A0\u33A4\u33C4\u33C7',
		cal: '\u3388',
		d: '\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A\u01C4\u01C6\u01F1\u01F3\u1D30\u1D48\u2145\u2146\u216E\u217E\u249F\u32CF\u3372\u3377\u3379\u3397\u33AD\u33AF\u33C5\u33C8',
		dz: '\u01F3\u01C6',
		e: '\u24D4\uFF45\xE8\xE9\xEA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\xEB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD\u1D31\u1D49\u2091\u2121\u212F\u2130\u2147\u24A0\u3250\u32CD\u32CE',
		f: '\u24D5\uFF46\u1E1F\u0192\uA77C\u1DA0\u2109\u2131\u213B\u24A1\u338A\u338C\u3399\uFB00\uFB04',
		g: '\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F\u1D33\u1D4D\u210A\u24A2\u32CC\u32CD\u3387\u338D\u338F\u3393\u33AC\u33C6\u33C9\u33D2\u33FF',
		h: '\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265\u02B0\u1D34\u210B\u210E\u24A3\u32CC\u3371\u3390\u3394\u33CA\u33CB\u33D7',
		hv: '\u0195',
		i: '\u24D8\uFF49\xEC\xED\xEE\u0129\u012B\u012D\xEF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131\u0132\u0133\u1D35\u1D62\u2071\u2110\u2111\u2139\u2148\u2160\u2163\u2165\u2168\u216A\u216B\u2170\u2173\u2175\u2178\u217A\u217B\u24A4\u337A\u33CC\u33D5\uFB01\uFB03',
		j: '\u24D9\uFF4A\u0135\u01F0\u0249\u0132\u01C7\u01CC\u02B2\u1D36\u2149\u24A5\u2C7C',
		k: '\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3\u1D37\u1D4F\u212A\u24A6\u3384\u3385\u338F\u3391\u3398\u339E\u33A2\u33A6\u33AA\u33B8\u33BE\u33C0\u33C6\u33CD\u33CF',
		kcal: '\u3389',
		l: '\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747\u01C7\u01C9\u02E1\u1D38\u2112\u2113\u2121\u216C\u217C\u24A7\u32CF\u33D0\u33D3\u33D5\u33D6\u33FF\uFB02\uFB04',
		lj: '\u01C9',
		m: '\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F\u1D39\u1D50\u2120\u2122\u2133\u216F\u217F\u24A8\u3377\u3379\u3383\u3386\u338E\u3392\u3396\u3399\u33A8\u33AB\u33B3\u33B7\u33B9\u33BD\u33BF\u33C1\u33C2\u33CE\u33D0\u33D4\u33D6\u33D8\u33D9\u33DE\u33DF',
		n: '\u24DD\uFF4E\u01F9\u0144\xF1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5\u01CA\u01CC\u1D3A\u207F\u2115\u2116\u24A9\u3381\u338B\u339A\u33B1\u33B5\u33BB\u33CC\u33D1',
		nj: '\u01CC',
		o: '\u24DE\uFF4F\xF2\xF3\xF4\u1ED3\u1ED1\u1ED7\u1ED5\xF5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\xF6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\xF8\u01FF\u0254\uA74B\uA74D\u0275\xBA\u1D3C\u1D52\u2092\u2105\u2116\u2134\u24AA\u3375\u33C7\u33D2\u33D6',
		oi: '\u01A3',
		ou: '\u0223',
		oo: '\uA74F',
		p: '\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755\u1D3E\u1D56\u2119\u24AB\u3250\u3371\u3376\u3380\u338A\u33A9\u33AC\u33B0\u33B4\u33BA\u33CB\u33D7\u33DA',
		q: '\u24E0\uFF51\u024B\uA757\uA759\u211A\u24AC\u33C3',
		r: '\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783\u02B3\u1D3F\u1D63\u20A8\u211B\u211D\u24AD\u32CD\u3374\u33AD\u33AF\u33DA\u33DB',
		s: '\u24E2\uFF53\xDF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B\u017F\u02E2\u20A8\u2101\u2120\u24AE\u33A7\u33A8\u33AE\u33B3\u33DB\u33DC\uFB06',
		t: '\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787\u1D40\u1D57\u2121\u2122\u24AF\u3250\u32CF\u3394\u33CF\uFB05\uFB06',
		tz: '\uA729',
		u: '\u24E4\uFF55\xF9\xFA\xFB\u0169\u1E79\u016B\u1E7B\u016D\xFC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289\u1D41\u1D58\u1D64\u2106\u24B0\u3373\u337A',
		v: '\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C\u1D5B\u1D65\u2163\u2167\u2173\u2177\u24B1\u2C7D\u32CE\u3375\u33B4\u33B9\u33DC\u33DE',
		vy: '\uA761',
		w: '\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73\u02B7\u1D42\u24B2\u33BA\u33BF\u33DD',
		x: '\u24E7\uFF58\u1E8B\u1E8D\u02E3\u2093\u213B\u2168\u216B\u2178\u217B\u24B3\u33D3',
		y: '\u24E8\uFF59\u1EF3\xFD\u0177\u1EF9\u0233\u1E8F\xFF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF\u02B8\u24B4\u33C9',
		z: '\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763\u01F1\u01F3\u1DBB\u2124\u2128\u24B5\u3390\u3394',
	};

	/**
	 * A map of all japanese hiragana characters
	 *
	 * @author SirCmpwn
	 * @link   https://github.com/SirCmpwn/hiragana.js
	 */
	japaneseMap = {
		'a': 'あ',
		'i': 'い',
		'u': 'う',
		'e': 'え',
		'o': 'お',
		'ka': 'か',
		'ki': 'き',
		'ku': 'く',
		'ke': 'け',
		'ko': 'こ',
		'sa': 'さ',
		'shi': 'し',
		'su': 'す',
		'se': 'せ',
		'so': 'そ',
		'ta': 'た',
		'chi': 'ち',
		'tsu': 'つ',
		'te': 'て',
		'to': 'と',
		'na': 'な',
		'ni': 'に',
		'nu': 'ぬ',
		'ne': 'ね',
		'no': 'の',
		'ha': 'は',
		'hi': 'ひ',
		'fu': 'ふ',
		'he': 'へ',
		'ho': 'ほ',
		'ma': 'ま',
		'mi': 'み',
		'mu': 'む',
		'me': 'め',
		'mo': 'も',
		'ya': 'や',
		'yu': 'ゆ',
		'yo': 'よ',
		'ra': 'ら',
		'ri': 'り',
		'ru': 'る',
		're': 'れ',
		'ro': 'ろ',
		'wa': 'わ',
		'wo': 'を',
		'ga': 'が',
		'gi': 'ぎ',
		'gu': 'ぐ',
		'ge': 'げ',
		'go': 'ご',
		'za': 'ざ',
		'ji': 'じ',
		'zu': 'ず',
		'ze': 'ぜ',
		'zo': 'ぞ',
		'da': 'だ',
		'de': 'で',
		'do': 'ど',
		'ba': 'ば',
		'bi': 'び',
		'bu': 'ぶ',
		'be': 'べ',
		'bo': 'ぼ',
		'pa': 'ぱ',
		'pi': 'ぴ',
		'pu': 'ぷ',
		'pe': 'ぺ',
		'po': 'ぽ',
		'hu': 'ふ',
		'tu': 'つ',
		'si': 'し',
		'ti': 'ち',
		'kya': 'きゃ',
		'kyu': 'きゅ',
		'kyo': 'きょ',
		'sha': 'しゃ',
		'shu': 'しゅ',
		'sho': 'しょ',
		'cha': 'ちゃ',
		'chu': 'ちゅ',
		'cho': 'ちょ',
		'nya': 'にゃ',
		'nyu': 'にゅ',
		'nyo': 'にょ',
		'hya': 'ひゃ',
		'hyu': 'ひゅ',
		'hyo': 'ひょ',
		'mya': 'みゃ',
		'myu': 'みゅ',
		'myo': 'みょ',
		'rya': 'りゃ',
		'ryu': 'りゅ',
		'ryo': 'りょ',
		'gya': 'ぎゃ',
		'gyu': 'ぎゅ',
		'gyo': 'ぎょ',
		'ja': 'じゃ',
		'ju': 'じゅ',
		'jo': 'じょ',
		'bya': 'びゃ',
		'byu': 'びゅ',
		'byo': 'びょ',
		'pya': 'ぴゃ',
		'pyu': 'ぴゅ',
		'pyo': 'ぴょ',
		'xyu': 'ゅ',
		'xyo': 'ょ',
		'xya': 'ゃ',
		'xtsu': 'っ',
		'xtu': 'っ',
		'xa': 'ぁ',
		'xi': 'ぃ',
		'xu': 'ぅ',
		'xe': 'ぇ',
		'xo': 'ぉ',
		'lyu': 'ゅ',
		'lyo': 'ょ',
		'lya': 'ゃ',
		'ltsu': 'っ',
		'ltu': 'っ',
		'la': 'ぁ',
		'li': 'ぃ',
		'lu': 'ぅ',
		'le': 'ぇ',
		'lo': 'ぉ',
		'rr': 'っr',
		'tt': 'っt',
		'kk': 'っk',
		'cc': 'っc',
		'pp': 'っp',
		'ss': 'っs',
		'ww': 'っw',
		'ss': 'っy',
		'dd': 'っd',
		'ff': 'っf',
		'gg': 'っg',
		'hh': 'っh',
		'jj': 'っj',
		'zz': 'っz',
		'xx': 'っx',
		'vv': 'っv',
		'bb': 'っb',
		'mm': 'っm',
		'nn': 'ん'
	};

	var hebrewMap = {
		// Consonants
		'\''      : ['\u05D0', '\u05E2'],
		'v'       : ['\u05D1', '\u05D5', '\u05D5\u05BC'],
		'b'       : '\u05D1\u05BC',
		'g'       : ['\u05D2', '\u05D2\u05BC'],
		'j'       : '\u05D2\u05F3',
		'd'       : ['\u05D3', '\u05D3\u05BC'],
		'dh'      : '\u05D3\u05F3',
		'h'       : ['\u05D4', '\u05D4\u05BC'],
		'z'       : ['\u05D6', '\u05D6\u05BC'],
		'zh'      : '\u05D6\u05F3',
		'\u1E96'  : '\u05D7',
		't'       : ['\u05D8', '\u05D8\u05BC'],
		'y'       : ['\u05D9', '\u05D9\u05BC'],
		'kh'      : ['\u05DA', '\u05DB'],
		'k'       : ['\u05DA\u05BC', '\u05DB\u05BC'],
		'l'       : ['\u05DC', '\u05DC\u05BC'],
		'm'       : ['\u05DD', '\u05DE', '\u05DE\u05BC'],
		'n'       : ['\u05DF', '\u05E0', '\u05E0\u05BC'],
		's'       : ['\u05E1', '\u05E1\u05BC', '\u05E9\u05C2', '\u05E9\u05BC\u05C2'],
		'f'       : ['\u05E3', '\u05E4'],
		'p'       : ['\u05E3\u05BC', '\u05E4\u05BC'],
		'ts'      : ['\u05E5', '\u05E6', '\u05E6\u05BC'],
		'tsh'     : ['\u05E5\u05F3', '\u05E6\u05F3'],
		'k'       : ['\u05E7', '\u05E7\u05BC'],
		'r'       : ['\u05E8', '\u05E8\u05BC'],
		'sh'      : ['\u05E9\u05C1', '\u05E9\u05BC\u05C1'],
		't'       : ['\u05EA', '\u05EA\u05BC'],
		'th'      : '\u05EA\u05F3',

		// Vowels
		'e'   : ['\u05D8\u05B0', '\u05D7\u05B1', '\u05D8\u05B5', '\u05D8\u05B5\u05D9', '\u05D8\u05B6', '\u05D8\u05B6\u05D9'],
		'a'   : ['\u05D7\u05B2', '\u05D8\u05B7'],
		'o'   : ['\u05D7\u05B3', '\u05D8\u05B8', '\u05D8\u05B9'],
		'i'   : '\u05D8\u05B4',
		'u'   : ['\u05D8\u05BB', '\u05D8\u05D5\u05BC'],

		// Israeli Diphthongs
		'ay'  : ['\u05D8\u05B7\u05D9', '\u05D8\u05B7\u05D9\u05B0', '\u05D8\u05B8\u05D9', '\u05D8\u05B8\u05D9\u05B0'],
		'oy'  : ['\u05D8\u05B9\u05D9', '\u05D8\u05B9\u05D9\u05B0'],
		'uy'  : ['\u05D8\u05BB\u05D9', '\u05D8\u05BB\u05D9\u05B0', '\u05D8\u05D5\u05BC\u05D9', '\u05D8\u05D5\u05BC\u05D9\u05B0']
	};

	hebrewList = [];

	// Convert the hebrew map to an ordered list
	for (base in hebrewMap) {
		if (Array.isArray(hebrewMap[base])) {
			for (i = 0; i < hebrewMap[base].length; i++) {
				hebrewList.push({roman: base, original: hebrewMap[base][i]});
			}
		} else {
			hebrewList.push({roman: base, original: hebrewMap[base]});
		}
	}

	// Sort the hebrewlist
	hebrewList.sort(sortList);

	japaneseList = [];

	for (base in baseDiacriticsMap) {

		// Get all the possible diacritics for this base
		diacritics = baseDiacriticsMap[base].split('');

		// Create a reversed map: all diacritics to their base letters
		diacritics.forEach(function(diacritic) {
			diacriticsMap[diacritic] = base;
		});
	}

	// Convert the japanese map to an ordered list
	for (base in japaneseMap) {
		japaneseList.push({roman: base, original: japaneseMap[base]});
	}

	// Sort the japaneselist
	japaneseList.sort(sortList);

	/**
	 * A regex for finding all combining marks
	 *
	 * @author  mathiasbynens
	 * @link    https://github.com/mathiasbynens
	 */
	allCombiningMarks = /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF]|[\u0370-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uDC00-\uFE1F\uFE30-\uFFFF]/g;

	/**
	 * Remove all combining marks from a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 */
	Blast.definePrototype('String', 'removeCombiningMarks', function removeCombiningMarks() {
		return this.replace(allCombiningMarks, '');
	});

	/**
	 * Remove special characters from a string
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	Blast.definePrototype('String', 'romanize', function romanize() {

		var length,
		    result  = '',
		    str,
		    i;

		// Romanize possible japanese signs
		str = Bound.String.romanizeJapanese(this);

		// Romanize possible hebrew signs
		str = Bound.String.romanizeHebrew(str);

		// Remove any other combining marks
		str = Bound.String.removeCombiningMarks(str);

		length = str.length;

		for (i = 0; i < length; i++) {
			result += diacriticsMap[str[i]] || str[i];
		}

		return result;
	});

	/**
	 * Turn japanese characters into their romanized forms
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Boolean}   skipCheck   Don't check for characters first
	 */
	Blast.definePrototype('String', 'romanizeJapanese', function romanizeJapanese(skipCheck) {

		var str,
		    entry,
		    i;

		// Don't do anything if the string doesn't actually contain hebrew marks
		if (!skipCheck && !Bound.String.containsJapanese(this)) {
			return this;
		}

		str = this;

		for (i = 0; i < japaneseList.length; i++) {
			entry = japaneseList[i];

			if (!entry.regex) {
				entry.regex = new RegExp(entry.original, 'g');
			}

			str = str.replace(entry.regex, entry.roman);
		}

		return str;
	});

	/**
	 * Turn hebrew characters into their romanized forms
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @param    {Boolean}   skipCheck   Don't check for characters first
	 */
	Blast.definePrototype('String', 'romanizeHebrew', function romanizeHebrew(skipCheck) {

		var str,
		    entry,
		    i;

		// Don't do anything if the string doesn't actually contain hebrew marks
		if (!skipCheck && !Bound.String.containsHebrew(this)) {
			return this;
		}

		str = this;

		for (i = 0; i < hebrewList.length; i++) {
			entry = hebrewList[i];

			if (!entry.regex) {
				entry.regex = new RegExp(entry.original, 'g');
			}

			str = str.replace(entry.regex, entry.roman);
		}

		return str;
	});

	/**
	 * Replace the given character, but remain case sensitive
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	function replaceSensitive(chr) {

		if (typeof baseDiacriticsMap[chr] === 'undefined') {
			return chr;
		}

		return '[' + chr + (baseDiacriticsMap[chr]) + ']';
	};

	/**
	 * Replace the given character without caring about the case
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.1.0
	 */
	function replaceInsensitive(chr) {

		var lower = chr.toLowerCase(),
		    upper = chr.toUpperCase();

		if (lower == upper) {
			return chr;
		}

		return '[' + lower + upper + (baseDiacriticsMap[chr]||'') + ']';
	};

	var metaRegex     = /([|()[{.+*?^$\\])/g,
	    whiteRegex    = /\s+/,
	    ungroupRegex  = /\[\\\]\[/g,
	    hebrewRegex   = /[\u0590-\u05FF]/,
	    japaneseRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

	/**
	 * Determine if a string contains hebrew signs
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'containsHebrew', function containsHebrew() {
		return (this.search(hebrewRegex) > -1);
	});

	/**
	 * Determine if a string contains japanese signs
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.0
	 * @version  0.1.0
	 *
	 * @return   {Boolean}
	 */
	Blast.definePrototype('String', 'containsJapanese', function containsJapanese() {
		return (this.search(japaneseRegex) > -1);
	});

	/**
	 * Create a regex pattern string that will ignore accents
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Boolean}   insensitive   Create a case insensitive regex
	 * @param    {Boolean}   any           Look for any word
	 *
	 * @return   {String}    Pattern that can be used to construct a regex
	 */
	Blast.definePrototype('String', 'diacriticPattern', function diacriticPattern(insensitive, any) {

		var replacer,
		    pattern,
		    words,
		    text,
		    join,
		    i;

		if (insensitive) {
			replacer = replaceInsensitive;
		} else {
			replacer = replaceSensitive;
		}

		if (any) {
			join = '|'
		} else {
			join = '\\s+';
		}

		// Escape meta characters
		text = this.replace(metaRegex, '\\$1');

		// Split into words
		words = text.split(whiteRegex);

		// Replace characters by their compositors
		for (i = 0; i < words.length; i++) {
			words[i] = words[i].replace(/\S/g,replacer);
		}

		// Join as alternatives
		pattern = words.join(join);

		// Ungroup escaped characters
		pattern = pattern.replace(ungroupRegex, '[\\');

		return pattern;
	});

	/**
	 * Create a regex that will ignore accents
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.0.1
	 * @version  0.0.1
	 *
	 * @param    {Boolean}   insensitive   Create a case insensitive regex
	 * @param    {Boolean}   any           Look for any word
	 *
	 * @return   {RegExp}
	 */
	Blast.definePrototype('String', 'diacriticRegex', function diacriticRegex(insensitive, any) {

		var pattern = Bound.String.diacriticPattern(this, insensitive, any),
		    regex;

		if (insensitive) {
			regex = new RegExp(pattern, 'gi');
		} else {
			regex = new RegExp(pattern, 'g');
		}

		return regex;
	});
};