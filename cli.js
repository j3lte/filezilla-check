#!/usr/bin/env node

/*
 * filezilla-check
 * https://github.com/j3lte/filezilla-check
 *
 * Copyright (c) 2015 Jelte Lagendijk
 * Licensed under the MIT license.
 */
'use strict';

var fs = require('fs'),
  _ = require('lodash'),
  xml2js = require('xml2js'),
  async = require('async'),
  portscanner = require('portscanner'),
  program = require('commander'),
  version = require('./package').version,
  ProgressBar = require('progress'),
  Table = require('cli-table'),
  IP = require('ip');

var CONCURRENT_REQUESTS = 10,
  serverList = [],
  timeout = 2000,
  parser = new xml2js.Parser(),
  status = {
    total: 0,
    open: 0,
    closed: 0
  },
  bar, sortKey;

var keys = [
    { key: 'name', name: 'Name' },
    { key: 'host', name: 'Ip', defaultSort: true },
    { key: 'status', name: 'Status' }
  ],
  sortByKeys = _.map(keys, function (key) { return key.name.toLowerCase(); }),
  defaultSort = _.get(_.find(keys, 'defaultSort'), 'name').toLowerCase();

program
  .version(version)
  .usage('[options] <sitemanager.xml>')
  .option('-t, --timeout <n>', 'Timeout in milliseconds', parseInt)
  .option('-s, --sort <sort>', 'Sort by (' + sortByKeys.join('|') + ') default:' + defaultSort, defaultSort)
  .option('-i, --ip <IP ADDRESS>', 'Test a single ip address')
  .parse(process.argv);

function exit() {
  program.outputHelp();
  process.exit(1);
}

function displayTable() {
  var firstKey = _.first(_.pluck(keys, 'key')),
      total = 'Total: ' + status.total + ', Open: ' + status.open + ', Closed: ' + status.closed;

  _.each(keys, function (key) {
    key.max = _.max(serverList, function(server) {
      return ('' + server[key.key]).length;
    })[key.key].length + 5;
    if (key.key === firstKey && key.max < total.length) {
      key.max = total.length + 3;
    }
  });

  var table = new Table({
    head: _.pluck(keys, 'name'),
    colWidths: _.pluck(keys, 'max'),
    style: {
      compact: true,
      'padding-left': 1
    }
  });

  _.each(_.sortBy(serverList, sortKey), function (server) {
    var rule = [];
    _.each(keys, function (key) {
      rule.push(server[key.key]);
    });
    table.push(rule);
  });

  table.push([]);
  var totalRule = _.fill(new Array(keys.length), '');
  totalRule[0] = total;
  table.push(totalRule);

  console.log('\n' + table.toString());
}

function getServer(server, callback) {
  portscanner.checkPortStatus(21, {
    host: server.host,
    timeout: timeout
  }, function(error, state) {

    server.status = !error ? state : 'error : ' + error;

    if (state === 'closed') {
      status.closed = status.closed + 1;
    } else if (state === 'open') {
      status.open = status.open + 1;
    }

    bar.tick();
    callback();
  });
}

function getServers () {
  status.total = serverList.length;

  bar = new ProgressBar('  Checking servers [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 53,
    total: serverList.length
  });

  async.eachLimit(serverList, CONCURRENT_REQUESTS, getServer, function(asyncErr) {
    if (asyncErr) {
      throw asyncErr;
    }

    displayTable();

  });
}

function processSiteManagerFile (file) {
  fs.readFile(file, function(err, data) {
    if (err) {
      throw err;
    }
    parser.parseString(data, function (parseErr, result) {
      if (parseErr) {
        throw parseErr;
      }
      var servers = result.FileZilla3.Servers[0].Server;
      serverList = _.chain(servers)
        .map(function (ser) {
          var name = ser._.replace(/[ \t]+/g, '').replace(/\n/g, ''),
              host = ser.Host[0].replace(/[ \t]+/g, '').replace(/\n/g, '');

          return {
            name: name,
            host: host,
            ip: IP.toLong(host)
          };
        })
        .value();

      getServers();
    });
  });
}

if (sortByKeys.indexOf(program.sort) === -1) {
  console.error('Not a valid sort key');
  exit();
} else {
  sortKey = program.sort;
}

if (program.timeout) {
  timeout = program.timeout;
}

if (program.ip) {
  keys = _.filter(keys, function(key) {
    return ['host', 'status'].indexOf(key.key) !== -1;
  });
  serverList.push({
    host: program.ip,
    ip: IP.toLong(program.ip)
  });
  getServers();
} else if (program.args.length !== 1) {
  console.error('no sitemanager.xml');
  exit();
} else {
  var filename = program.args[0];
  processSiteManagerFile(filename);
}
