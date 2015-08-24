# filezilla-check [![NPM version](https://badge.fury.io/js/filezilla-check.svg)](http://badge.fury.io/js/filezilla-check)

> Check ftp servers from a Filezilla sitemanager.xml

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i filezilla-check -g
```

## Usage

    filezilla-check [options] [sitemanager.xml]

See [help](https://github.com/j3lte/filezilla-check/blob/master/docs/cli.md)

## Output

```

  Checking servers [=============================================] 100% 0.0s

┌──────────────────────────────┬─────────────────────┬─────────────────────┐
│ Name                         │ Ip                  │ Status              │
├──────────────────────────────┼─────────────────────┼─────────────────────┤
│ Test-server 1                │ xxx.xxx.xxx.xxx     │ open                │
│ Test-server 2                │ xxx.xxx.xxx.xxx     │ open                │
│ Test-server 3                │ xxx.xxx.xxx.xxx     │ closed              │
├──────────────────────────────┼─────────────────────┼─────────────────────┤
│ Total: 3, Open: 2, Closed: 1 │                     │                     │
└──────────────────────────────┴─────────────────────┴─────────────────────┘


```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/j3lte/filezilla-check/issues/new)

## Author

**J.W. Lagendijk**

+ [github/j3lte](https://github.com/j3lte)
+ [twitter/j3lte](http://twitter.com/j3lte)

## License

Copyright © 2015-2015 J.W. Lagendijk
Released under the MIT license.
