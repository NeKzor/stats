const fetch = require('node-fetch');
const { log } = require('../utils');

class ResponseError extends Error {
    constructor(res) {
        super();
        this.message = 'request failed';
        this.response = res;
    }
}

const BASE_API = 'https://board.iverb.me';

class Portal2Boards {
    static async changelog(params) {
        params = params ? Object.entries(params).map((entry) => entry[0] + '=' + entry[1]) : [];
        const url = `${BASE_API}/changelog/json?${params.join('&')}`;

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'n^',
            },
        });

        log.info(`[API CALL] GET : ${url} : ${res.status}`);

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        return await res.json();
    }
}

module.exports = Portal2Boards;
