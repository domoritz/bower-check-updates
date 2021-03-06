[![npm version](https://badge.fury.io/js/bower-check-updates.svg)](http://badge.fury.io/js/bower-check-updates)
[![Dependency Status](https://david-dm.org/se-panfilov/bower-check-updates.svg)](https://david-dm.org/se-panfilov/bower-check-updates) 
[![devDependency Status](https://david-dm.org/se-panfilov/bower-check-updates/dev-status.svg)](https://david-dm.org/se-panfilov/bower-check-updates#info=devDependencies) 
[![Hex.pm](https://img.shields.io/hexpm/l/plug.svg)](https://github.com/se-panfilov/bower-check-updates/blob/master/LICENSE)

What?
--------------
`bower-check-updates` - is totally clone of [bower-check-updates][1], but it updates bower.json dependencies (bower-check-updates updates nodejs's package.json).

All the code is writed by [tjunnone][2]. I have just renamed `package.json` to `bower.json` (and added [closest-bower][3] module instead of [closest-package][4]). So if you want to contribute - better do it to `bower-check-updates`, and I'll merge the changes (notify me if I'm not).

[![NPM](https://nodei.co/npm/bower-check-updates.png)](https://nodei.co/npm/bower-check-updates/)

bower-check-updates
--------------

`bower-check-updates` is a command-line tool that allows you to **find the latest versions of dependencies**, regardless of any version constraints in your `bower.json` file.

`bower-check-updates` can optionally upgrade your `bower.json` file to
use the latest available versions, all while **maintaining your
existing semantic versioning policies**.

bower-check-updates is a command-line tool that allows you to find and save the *latest* versions of dependencies, regardless of any version constraints in your package.json file (unlike npm itself).

bower-check-updates *maintains your existing semantic versioning policies*, i.e., it will upgrade your `"express": "^4.11.2"` dependency to `"express": "^5.0.0"` when express 5.0.0 is released.

Installation
--------------

```sh
npm install -g bower-check-updates
```

Please consider installing the unstable version to help test pre-release features. You may even find [some features](#history) you needed that are not yet in the stable version. 

```sh
npm install -g bower-check-updates@unstable
```

Important Notes about v2
--------------
> *This documentation is for the upcoming v2 release, available on the `unstable` tag. It is recommended that you install the unstable branch using `npm install -g bower-check-updates@unstable` in preparation for v2. For documentation for the `stable` tag, please see [v1.5.1](https://github.com/tjunnone/bower-check-updates/tree/a7373782cb9623d44395eabf6382d6791749b16e). bower-check-updates v2 has a few important differences from v1:*

- Newer published versions that satisfy the specified range are *not* upgraded by default (e.g. `1.0.0` to `1.1.0`). This change was made because `npm update` handles upgrades within the satisfied range just fine, and bower-check-updates is primarily intended to provide functionality not otherwise provided by npm itself. **For the old behavior, use the -f/--force option. Even better, [let me know](https://github.com/tjunnone/bower-check-updates/issues/94), with reasons, why you think the old behavior is better.**
- Dependencies with less-than relations (e.g. `<1.0.0` or `<=1.2`) are converted to semantic wildcard relations (e.g. `^2.0.0` or `^2.0`). This change was made because if you are going to upgrade these to backwards-incompatible versions, the less-than contraint will no longer be relevant.
- The command-line argument now specifies a package name filter (e.g. `bcu /^gulp-/`). For the old behavior (specifying an alternative package.json), you can pipe the package.json through stdin.
- Use the easier-to-type `bcu` instead of `bower-check-updates`. `bower-check-updates` is preserved for backwards-compatibility.

Usage
--------------

Show any new dependencies for the project in the current directory:
```sh
$ bcu

"bootstrap" can be updated from ^2.8.0 to ^2.11.0  (Installed: 2.8.8, Latest: 2.11.0)
"angular" can be updated from ^1.3.0 to ^2.0.0 (Installed: 1.3.2, Latest: 2.0.0)

Run with '-u' to upgrade your bower.json
```

Upgrade a project's bower.json:

> **Make sure your bower.json is in version control and all changes have been committed. This *will* overwrite your bower.json.**

```sh
$ bcu -u

"bootstrap" can be updated from ^3.0.0 to ^3.3.0 (Installed: 3.0.0, Latest: 3.30.4)

bower.json upgraded
```

Filter by package name:
```sh
# match mocha and should packages exactly
$ bcu -f mocha,should         

# match packages that start with "gulp-" using regex
$ bcu -f /^gulp-/             

# match packages that do not start with "gulp-". Note: single quotes are required 
# here to avoid inadvertant bash parsing
$ bcu -f '/^(?!gulp-).*$/'    
```

Options
--------------
    -d, --dev                check only devDependencies
    -h, --help               output usage information
    -e, --error-level        set the error-level. 1: exits with error code 0 if no  
                             errors occur. 2: exits with error code 0 if no 
                             packages need updating (useful for continuous 
                             integration)
    -f, --force              force upgrade even when the latest version satisfies
                             the declared semver dependency
    -g, --global             check global packages instead of in the current project
    -j, --jsonAll            output new package.json instead of human-readable
                             message
    --jsonUpgraded           output upgraded dependencies in json
    -p, --prod               check only dependencies (not devDependencies)
    -r, --registry           specify third-party NPM registry
    -s, --silent             don't output anything
    -t, --greatest           find the highest versions available instead of the 
                             latest stable versions (alpha release only)
    -u, --upgrade            upgrade package.json dependencies to match latest 
                             versions (maintaining existing policy)
    -V, --version            output the version number

Integration
--------------
The tool allows integration with 3rd party code:

```javascript
var checkUpdates = require('bower-check-updates');

checkUpdates.run({
    upgrade: true, // see available options above
    force: true
}).then(function() {
    console.log('done upgrading dependencies');
});
```

How dependency updates are determined
--------------

- Direct dependencies will be increased to the latest stable version:
  - 2.0.1 => 2.2.0
  - 1.2 => 1.3
-  Semantic versioning policies for levels are maintained while satisfying the latest version:
  - ^1.2.0 => ^2.0.0
  - 1.x => 2.x
- "Any version" is maintained:
  - \* => \*
- "Greater than" is maintained:
  - \>0.2.0 => \>0.3.0
- Closed ranges are replaced with a wildcard:
  - 1.0.0 \< 2.0.0 => ^3.0.0

Problems?
--------------

Please [file an issue on github](https://github.com/se-panfilov/bower-check-updates/issues).

Pull requests are welcome :)

[1]: https://github.com/tjunnone/bower-check-updates
[2]: https://github.com/tjunnone
[3]: https://github.com/se-panfilov/closest-bower
[4]: https://github.com/hughsk/closest-package


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/se-panfilov/bower-check-updates/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

