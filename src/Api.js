class Api {
    constructor() {
        this.baseApi =
            process.env.NODE_ENV === 'development'
                ? 'http://localhost:8080'
                : 'https://raw.githubusercontent.com/NeKzBot/iverb-stats/api';
    }
    async request(route, date) {
        const res = await fetch(`${this.baseApi}/${route}/${date || 'latest'}.json`);
        console.log(`GET ${res.url} (${res.status})`);

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        return await res.json();
    }
}

export default new Api();
