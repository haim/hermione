'use strict';

const _ = require('lodash');
const qUtils = require('qemitter/utils');

const BaseHermione = require('./base-hermione');
const Runner = require('./runner');
const RunnerEvents = require('./constants/runner-events');
const signalHandler = require('./signal-handler');
const sets = require('./sets');
const validateUnknownBrowsers = require('./validators').validateUnknownBrowsers;
const Browser = require('./browser');

module.exports = class Hermione extends BaseHermione {
    constructor(configPath) {
        super(configPath);

        this._failed = false;
        this.api = {Browser};
    }

    run(testPaths, options) {
        options = options || {};

        validateUnknownBrowsers(options.browsers, _.keys(this._config.browsers));

        this._loadPlugins();

        const runner = Runner.create(this._config);
        runner.on(RunnerEvents.TEST_FAIL, () => this._fail());
        runner.on(RunnerEvents.ERROR, () => this._fail());

        _.forEach(options.reporters, (reporter) => applyReporter(runner, reporter));

        qUtils.passthroughEvent(runner, this, _.values(RunnerEvents.getSync()));
        qUtils.passthroughEventAsync(runner, this, _.values(RunnerEvents.getAsync()));
        qUtils.passthroughEventAsync(signalHandler, this, RunnerEvents.EXIT);

        _.extend(this._config.system.mochaOpts, {grep: options.grep});

        return sets.reveal(this._config.sets, {paths: testPaths, browsers: options.browsers, sets: options.sets})
            .then((testFiles) => runner.run(testFiles))
            .then(() => !this.isFailed());
    }

    readTests(testPaths, browsers, options) {
        options = _.defaults(options || {}, {loadPlugins: true});

        options.loadPlugins && this._loadPlugins();

        const runner = Runner.create(this._config);
        options.loadPlugins && qUtils.passthroughEvent(runner, this, _.values(RunnerEvents.getSync()));

        return sets.reveal(this._config.sets, {paths: testPaths, browsers})
            .then((testFiles) => runner.buildSuiteTree(testFiles));
    }

    isFailed() {
        return this._failed;
    }

    _fail() {
        this._failed = true;
    }

    isWorker() {
        return false;
    }
};

function applyReporter(runner, reporter) {
    if (typeof reporter === 'string') {
        try {
            reporter = require('./reporters/' + reporter);
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                throw new Error('No such reporter: ' + reporter);
            }
            throw e;
        }
    }
    if (typeof reporter !== 'function') {
        throw new TypeError('Reporter must be a string or a function');
    }

    var Reporter = reporter;

    new Reporter().attachRunner(runner);
}
