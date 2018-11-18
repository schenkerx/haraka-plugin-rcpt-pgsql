'use strict';

const pg = require('pg');
const constants = require('haraka-constants');

exports.register = function () {
    const plugin = this;
    plugin.inherits('rcpt_to.host_list_base');

    plugin.load_host_list();
    plugin.load_rcpt_to_pg_ini();

    const config = plugin.cfg;
    const dbConfig = {
        user: config.database.user,
        database: config.database.db,
        password: config.database.password,
        host: config.database.host,
        port: config.database.port,
        keepAlive: true,
        max: config.database.maxPoolSize,
        idleTimeoutMillis: config.database.idleTimeoutMillis,
        ssl: config.database.enableSSL ? {
            sslCA: config.database.sslCA
        } : false
    };
    plugin.pool = pg.Pool(dbConfig);
    plugin.pool.on('error', (err, _) => {
        this.logerror('Idle client error. Probably a network issue or a database restart.'
            + err.message + err.stack);
    });
    plugin.aliasQuery = config.database.aliasQuery;
    plugin.accountQuery = config.database.accountQuery;

    plugin.register_hook('rcpt', 'aliases');
    plugin.register_hook('rcpt', 'validate');
}

exports.shutdown = function () {
    this.pool.end();
}

exports.load_rcpt_to_pg_ini = function () {
    const plugin = this;

    plugin.cfg = plugin.config.get('rcpt_to.pg.ini', {
        booleans: [
            '+rcpt.authoratative',
            '-database.enableSSL'
        ]
    },
    function () {
        plugin.load_rcpt_to_pg_ini();
    });
}

exports.aliases = (next, connection, params) => {

}

exports.validate = (next, connection, params) => {

}
