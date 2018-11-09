module.exports = function BlastSorting(Blast, Collection) {

	/**
	 * Sort the array by its numeric values.
	 * Much faster than the native sort, but the result is not stable.
	 *
	 * Flashsort is a distribution sorting algorithm originally
	 * published in 1998 by Karl-Dietrich Neubert.
	 * Some optimizations by Benjamin Guihaire were implemented.
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @return   {Array}
	 */
	Blast.definePrototype('Array', function flashsort() {

		var arr     = this,
		    length  = arr.length,
		    arrmin  = arr[0],
		    arrmax  = arrmin,
		    target,
		    flash,
		    kmin,
		    kmax,
		    hold,
		    move    = 0,
		    max     = 0,
		    lk,
		    c1,
		    m,
		    i,
		    j,
		    k,
		    l;

		if (length < 9) {
			m = ~~(length * 0.6);
		} else if (length < 15) {
			m = ~~(length * 0.7);
		} else if (length < 20) {
			m = ~~(length * 0.8);
		} else if (length < 35) {
			m = ~~(length * 0.9);
		} else {
			m = ~~(length * 0.4);
		}

		l = new Array(m);

		for (i = 0; i < m; i++) {
			l[i] = 0;
		}

		// Iterate 2 items at a time
		for (i = 0; (i+=2) < length;) {
			if ((kmin = arr[i]) > (kmax = arr[i-1])) {
				if (kmax < arrmin) arrmin = kmax;
				if (kmin > arrmax) {
					max = i;
					arrmax = kmin;
				}
			} else {
				if (kmin < arrmin) arrmin = kmin;
				if (kmax > arrmax) {
					max = i-1;
					arrmax = kmax;
				}
			}
		}

		// Because the previous loop started at the second item,
		// we need to do an extra check for even arrays
		if (--i < length) {
			if ((k = arr[i]) < arrmin) arrmin = k;
			else if (k > arrmax) {
				arrmax = k;
				max = i;
			}
		}

		if (arrmin === arrmax) {
			return arr;
		}

		// Some implementations use a bitshift for c1,
		// but that's not going to speed things up in javascript 
		c1 = (m - 1) / (arrmax - arrmin);

		for (i = 0; i < length; ++i) {
			++l[~~(c1 * (arr[i] - arrmin))];
		}

		// Even though the array is accessed twice here,
		// caching it results in worse performance
		for (k = 1; k < m; ++k) {
			l[k] += l[k - 1];
		}

		hold = arrmax;
		arr[max] = arr[0];
		arr[0] = hold;

		j = 0;
		k = m - 1;
		i = length - 1;

		while (move < i) {

			while (j >= l[k]) {
				k = ~~(c1 * (arr[++j] - arrmin));
			}

			if (k < 0) {
				break;
			}

			flash = arr[j];

			// Caching lk is useful here
			lk = l[k];
			while (j !== lk) {
				hold = arr[(lk = --l[k = ~~(c1 * (flash - arrmin))])];
				arr[lk] = flash;
				flash = hold;
				++move;
			}
		}

		for (j = 0; ++j < length;) {
			hold = arr[j];
			i = j;

			while ((--i >= 0) && ((k = arr[i]) > hold)) {
				arr[i+1] = k;
			}

			arr[i+1] = hold;
		}

		return arr;
	});

};