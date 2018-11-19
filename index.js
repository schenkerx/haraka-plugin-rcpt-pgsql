'use strict';

const pg = require('pg');
const constants = require('haraka-constants');
const Address = require('address-rfc2821').Address;

exports.register = function () {
    const plugin = this;

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
    plugin.pool = new pg.Pool(dbConfig);
    plugin.pool.on('error', (err, _) => {
        connection.logerror(plugin, 'Idle client error. Probably a network issue or a database restart.'
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
            '+rcpt.authoritative',
            '-database.enableSSL'
        ]
    },
    function () {
        plugin.load_rcpt_to_pg_ini();
    });
}

exports.aliases = function (next, connection, params) {
    const plugin = this;
    const tx = connection.transaction;
    if (!tx) return next();
    // Do not alias when sending email
    if (connection.relaying) next(constants.OK);

    const rcpt = params[0];
    (async () => {
        const client = await plugin.pool.connect();
        try {
            const result = await client.query(plugin.aliasQuery, [rcpt.user+"@"+rcpt.host]);
            if (result.rowCount != 0) {
                const destination = result.rows[0].destination;
                connection.logdebug(plugin, "aliasing " + tx.rcpt_to + " to " + destination);
                tx.rcpt_to.pop();
                tx.rcpt_to.push(new Address(`<${destination}>`));
            }
            next();
        } finally {
            client.release();
        }
    })().catch(e => {
        connection.logerror(plugin, "Unable to query alias. " + e.stack);
        next(constants.DENYSOFT);
    });
}

exports.validate = function (next, connection, params) {
    const plugin = this;
    const tx = connection.transaction;
    const rcpt = tx.rcpt_to[0];
    // Do not validate recipient when sending email
    if (connection.relaying) next(constants.OK);

    (async () => {
        const client = await plugin.pool.connect();
        try {
            const result = await client.query(plugin.accountQuery, [rcpt.user+"@"+rcpt.host]);
            if (result.rows[0].exists) {
                plugin.cfg.rcpt.authoritative ? next(constants.OK) : next();
            } else {
                next(constants.DENY);
            }
        } finally {
            client.release();
        }
    })().catch(e => {
        connection.logerror(plugin, "Unable to validate " + rcpt.user + "@" + rcpt.host + ". " + e.stack);
        next(constants.DENYSOFT);
    });
}
