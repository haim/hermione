'use strict';

const q = require('bluebird-q');

// FIXME: remove this adapter after migration from "q" to "bluebird"
module.exports = class QBrowserPool {
    static create(browserPool) {
        return new QBrowserPool(browserPool);
    }

    constructor(browserPool) {
        this._browserPool = browserPool;
    }

    getBrowser(id, opts) {
        return q(this._browserPool.getBrowser(id, opts));
    }

    freeBrowser(browser, opts) {
        return q(this._browserPool.freeBrowser(browser, opts));
    }

    cancel() {
        return this._browserPool.cancel();
    }
};
