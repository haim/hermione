'use strict';

module.exports = class BrowserAgent {
    static create(browserId, pool) {
        return new BrowserAgent(browserId, pool);
    }

    constructor(browserId, pool) {
        this.browserId = browserId;

        this._pool = pool;
    }

    getBrowser(sessionId, hostname, port) {
        return this._pool.getBrowser(this.browserId, sessionId, hostname, port);
    }

    freeBrowser(browser) {
        this._pool.freeBrowser(browser);
    }
};
