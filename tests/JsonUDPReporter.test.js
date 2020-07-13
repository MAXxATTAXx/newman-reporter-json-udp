const {EventEmitter} = require('events');
const JsonUDPReporter = require('../lib/JsonUDPReporter');
const fs = require('fs');

const reporterOptions = {};
const options = {
    collection: {name: "TestCollection"},
}
let outputData = "";
const storeLog = inputs => (outputData += inputs + "~~~");

describe('validIp', () => {
    test('given an invalid ip address returns false', () => {
        const sut = new JsonUDPReporter(new EventEmitter(), reporterOptions, options);
        const actual = sut.validIp('www.google.com');
        expect(actual).toBe(false);
    });

    test('given a valid ip address returns true', () => {
        const sut = new JsonUDPReporter(new EventEmitter(), reporterOptions, options);
        const actual = sut.validIp('192.168.1.200');
        expect(actual).toBe(true);
    });
});

describe('validPort', () => {
    test('given an invalid port returns false', () => {
        const sut = new JsonUDPReporter(new EventEmitter(), reporterOptions, options);
        const actual = sut.validPort(-100);
        expect(actual).toBe(false);
    });
    test('given a valid port returns true', () => {
        const sut = new JsonUDPReporter(new EventEmitter(), reporterOptions, options);
        const actual = sut.validPort(9999);
        expect(actual).toBe(true);
    });
});

describe ('extractHeaders', () => {
    test('given a list of headers return the expected values', () => {
        const sut = new JsonUDPReporter(new EventEmitter(), reporterOptions, options);
        const actual = sut.extractHeaders({
            members: [{
                key: 'X-Forwarded-For',
                value: '1.1.1.1'
            }]
        }, ['X-Forwarded-For', 'X-Random-Header']);
        expect(actual).toEqual({
            'X-Forwarded-For': '1.1.1.1',
            'X-Random-Header': ''
        });
    });
})