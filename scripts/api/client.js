const fetch = require('node-fetch');

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
        const res = await fetch(`${BASE_API}/changelog/json?${params.join('&')}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'n^',
            },
        });

        if (res.status !== 200) {
            throw new ResponseError(res);
        }

        return await res.json();
    }
}

module.exports = Portal2Boards;
