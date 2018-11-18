// node.js built-in modules
const assert   = require('assert');

// npm modules
const fixtures = require('haraka-test-fixtures');

beforeEach(function (done) {
    this.plugin = new fixtures.plugin('rcpt_to.pg');
    done();  // if a test hangs, assure you called done()
});

describe('rcpt_to.pg', function () {
    it('loads', function (done) {
        assert.ok(this.plugin);
        done();
    });
});

describe('load_rcpt_to_pg_ini', function () {
    it('loads rcpt_to.pg.ini from config/rcpt_to.pg.ini', function (done) {
        this.plugin.load_rcpt_to_pg_ini();
        assert.ok(this.plugin.cfg);
        done();
    });

    it('initializes enabled boolean', function (done) {
        this.plugin.load_rcpt_to_pg_ini();
        assert.equal(this.plugin.cfg.rcpt.authoritative, true, this.plugin.cfg);
        assert.equal(this.plugin.cfg.database.enableSSL, false, this.plugin.cfg);
        done();
    });
});
