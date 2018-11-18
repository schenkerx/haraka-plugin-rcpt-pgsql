# haraka-plugin-rcpt-pgsql

This plugin tries to validate recipients against a PostgreSQL compatible database. This will help in authenticating users by PostgreSQL databases with Haraka.

The plugin have almost no assumption on your database schema. It is completely configurable using the config/rcpt_to.ldap.ini file.

The logic that is followed is:

- Run an query to see if the recipient is one of the aliases of an exists user. If yes, redirect the email to that user.
- Run an query to validate if the user exists in records.
