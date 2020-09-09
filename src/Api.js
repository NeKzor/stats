class Api {
    constructor() {
        this.baseApi =
            process.env.NODE_ENV === 'development'
                ? 'http://localhost:8080'
                : 'https://raw.githubusercontent.com/NeKzor/nekzor.github.io/master/iverb-stats';
    }
    async request(route, date) {
        let res = await fetch(`${this.baseApi}/${route}/${date || 'latest'}.json`);
        console.log(`GET ${res.url} (${res.status})`);
        return res.ok ? await res.json() : [];
    }
}

export default new Api();
