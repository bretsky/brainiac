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
	let {digits} = config;

	let max = Math.pow(10, digits) - 1;
	let l = randrange(-max, max);
	let r = randrange(-max, max);
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
	let {digits} = config;

	let max = Math.pow(10, digits) - 1;
	let l = randrange(-max, max);
	let r = randrange(-max, max);
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
	let {digits} = config;

	let max = Math.pow(10, digits) - 1;
	let l = randrange(-max, max);
	let r = randrange(-max, max);
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
	let {digits} = config;

	let max = Math.pow(10, digits) - 1;
	let res = randrange(-max, max);
	let r = randrange(-max, max);
	while (r === 0) {
		r = randrange(-max, max);
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