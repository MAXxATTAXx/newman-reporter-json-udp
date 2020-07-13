'use strict';

const ipRegex = require('ip-regex');

var SimpleUdpStream = require('simple-udp-stream');

var merge = require('lodash.merge');
var reduce = require('lodash.reduce');

class JsonUDPReporter {
    constructor(emitter, reporterOptions, options) {
        this.reporterOptions = reporterOptions;
        this.options = options;
        this.flowId = `${new Date().getTime() + Math.random()}`;
        const events = 'start beforeIteration iteration beforeItem item beforePrerequest prerequest beforeScript script beforeRequest request beforeTest test beforeAssertion assertion console exception beforeDone done'.split(' ');
        events.forEach((e) => { if (typeof this[e] == 'function') emitter.on(e, (err, args) => this[e](err, args)) });
    }

    start(err, e) {
        if (!this.validIp(this.reporterOptions.jsonUdpIp)) {
            throw `ERROR: Destination hostname or address is missing! Add --reporter-json-udp-ip \'<ip-address>\'.`;
        }
        if (!this.validPort(this.reporterOptions.jsonUdpPort)) {
            throw `ERROR: Port is missing! Add --reporter-json-udp-port <port-number>.`;
        }
        if (this.reporterOptions.jsonUdpResponseHeaders) {
            this.reporterOptions.jsonUdpResponseHeaders = this.reporterOptions.jsonUdpResponseHeaders.split(',');
        } else {
            this.reporterOptions.jsonUdpResponseHeaders = [];
        }

        this.stream = new SimpleUdpStream({
            destination: this.reporterOptions.jsonUdpIp,
            port: this.reporterOptions.jsonUdpPort
        });
    }

    beforeItem(err, e) {
        if(err) return;
        this.currItem = {};
    }

    beforeRequest(err, e) {
        if (err || !e.item.name) return;
        const { cursor, item, request } = e;

        Object.assign(this.currItem, {
            collectionName: this.options.collection.name,
            iteration: cursor.iteration + 1,
            requestname: item.name,
            method: request.method,
            url: request.url.toString()
        });
    }

    request(err, e) {
        if (err || !e.item.name) {
            console.log(err);
        }

        const { status, code, responseTime, responseSize, stream, headers } = e.response;

        let resHeaders = this.extractHeaders(headers, this.reporterOptions.jsonUdpResponseHeaders);

        Object.assign(this.currItem, {
            status, code, responseTime, responseSize, responseHeaders: resHeaders, assertions: {
                failed: 0,
                failed_names: [],
                skipped: 0,
                skipped_names: [],
                executed: 0,
                executed_names: [],
            }
        });
    }

    assertion(err, e) {
        const {assertion } = e;
        const key = err ? 'failed' : e.skipped ? 'skipped' : 'executed';

        this.currItem.assertions[key]++;
        this.currItem.assertions[key + "_names"].push(assertion);
    }

    item(err ,e) {
        if (err) return;

        this.stream.write(JSON.stringify({ newman: this.currItem}));
    }

    done(err, e) {
        this.stream.end();
    }

    /* HELPERS */
    validIp(ip) {
        return ipRegex.v4({exact: true, includeBoundaries: true}).test(ip);
    }

    validPort(port) {
        return port >= 1 && port <= 65535;
    }

    extractHeaders(source, search) {
        let ret = {}
        search.forEach(header => {
            let head = source.members.find(k => k.key === header );
            ret[header] = head ? head.value : "";
        });

        return ret;
    }
}

module.exports = JsonUDPReporter;