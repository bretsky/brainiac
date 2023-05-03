const { Client } = require("pg");



class DB {
	constructor(user, host, database, password, port) {
		const credentials = {
			user,
			host,
			database,
			password,
			port
		};
		console.log(credentials);
		this.client = new Client(credentials);
	}

	async init() {
		await this.client.connect();
	}

	async getUser(userid) {
		const query = `SELECT * FROM users WHERE userid = $1`;
		const values = [userid];
		try {
			const {rows} = await this.client.query(query, values);
			return rows.length === 0 ? null : rows[0];
		} catch (err) {
			console.log(err);
			return null;
		}

	}

	async createUser(userid, password, email) {
		const query = `
			INSERT INTO users (userid, password, email)
			VALUES ($1, $2, $3)
		`;
		const values = [userid, password, email];
		try {
			await this.client.query(query, values);
			return {userid, password, email};
		} catch (err) {
			console.log(err);
			return null;
		}
		
	}

	async createBenchmark(userid, timestamp, op, l, r, elapsed, attempts) {
		const query = `
			INSERT INTO benchmarks (userid, timestamp, op, l, r, elapsed, attempts)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (userid, timestamp) DO NOTHING
		`;
		const values = [userid, new Date(timestamp), op, l, r, elapsed, attempts];
		console.log(values);
		try {
			await this.client.query(query, values);
			return {userid, timestamp, op, l, r, elapsed, attempts};
		} catch (err) {
			console.log(err);
			return null;
		}
	}
}


module.exports = DB;