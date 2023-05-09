const randrange = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const randomChoice = (arr) => {
	return arr[randrange(0, arr.length - 1)];
}

const formatNegative = (n, parens=false) => {
	if (parens && n < 0) {
		return `(${n})`.replace('-', '−');
	}
	return `${n}`.replace('-', '−');
}

const randAdd = (config) => {
	let {max, negative} = config;

	let min = negative ? -max : 0;
	let l = randrange(min, max);
	let r = randrange(min, max);
	let str = `${formatNegative(l)} + ${formatNegative(r, true)} =`;
	return {
		str,
		l,
		r,
		op: '+',
		result: l + r,
	}
}

const randSub = (config) => {
	let {max, negative} = config;

	let min = negative ? -max : 0;
	let l = randrange(min, max);
	let r = randrange(min, max);
	let str = `${formatNegative(l)} − ${formatNegative(r, true)} =`;
	return {
		str,
		l,
		r,
		op: '-',
		result: l - r,
	}
}

const randMul = (config) => {
	let {max, negative} = config;

	let min = negative ? -max : 0;
	let l = randrange(min, max);
	let r = randrange(min, max);
	let str = `${formatNegative(l)} × ${formatNegative(r)} =`;
	return {
		str,
		l,
		r,
		op: '*',
		result: l * r,
	}
}

const randDiv = (config) => {
	let {max, negative} = config;

	let min = negative ? -max : 0;
	let res = randrange(min, max);
	let r = randrange(min, max);
	while (r === 0) {
		r = randrange(min, max);
	}
	let l = r * res
	let str = `${formatNegative(l)} ÷ ${formatNegative(r)} =`;
	return {
		str,
		l,
		r,
		op: '/',
		result: res,
	}
}

module.exports = {
	randomChoice,
	randAdd,
	randSub,
	randMul,
	randDiv,
}