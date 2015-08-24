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
  Table = require('cli-table');

var CONCURRENT_REQUESTS = 10,
  table = new Table({
    head: ['Name', 'Ip', 'Status'],
    colWidths: [60, 25, 25],
    style: {
      compact: true,
      'padding-left': 1
    }
  }),
  serverList = [],
  timeout = 2000,
  parser = new xml2js.Parser(),
  status = {
    total: 0,
    open: 0,
    closed: 0
  },
  sortByKeys = ['ip', 'name', 'status'],
  bar;

program
  .version(version)
  .usage('[options] <sitemanager.xml>')
  .option('-t, --timeout <n>', 'Timeout in milliseconds', parseInt)
  .option('-s, --sort <sort>', 'Sort by (ip|name|status) default:ip', 'ip')
  .parse(process.argv);

function exit() {
  program.outputHelp();
  process.exit(1);
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

if (program.args.length !== 1) {
  console.error('no sitemanager.xml');
  exit();
}

if (sortByKeys.indexOf(program.sort) === -1) {
  console.error('Not a valid sort key');
  exit();
}

if (program.timeout) {
  timeout = program.timeout;
}

var file = program.args[0];
var sortKey = program.sort;

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
          host = ser.Host[0].replace(/[ \t]+/g, '').replace(/\n/g, ''),
          addrArray = host.split('.'),
          num = 0;

        for (var i = 0; i < addrArray.length; i++) {
          var power = 3 - i;
          num += ((parseInt(addrArray[i]) % 256 * Math.pow(256, power)));
        }

        return {
          name: name,
          host: host,
          ip: num
        };
      })
      .value();

    status.total = serverList.length;

    console.log();
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

      _.each(_.sortBy(serverList, sortKey), function (server) {
        table.push([server.name, server.host, server.status]);
      });

      table.push([]);
      var total = 'Total: ' + status.total + ', Open: ' + status.open + ', Closed: ' + status.closed;
      table.push([total, '', '']);

      console.log('\n' + table.toString());

    });
  });
});
