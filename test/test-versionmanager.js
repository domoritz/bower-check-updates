var vm = require("../lib/versionmanager");
var chai = require("chai");
var should = chai.should();
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('versionmanager', function () {

    before(function() {
        return vm.initialize(false).should.be.resolved;
    });

    describe('upgradeDependencyDeclaration', function () {
        it('numeric upgrades', function () {
            vm.upgradeDependencyDeclaration("0", "1.0.0").should.equal("1");
            vm.upgradeDependencyDeclaration("1", "10.0.0").should.equal("10");

            vm.upgradeDependencyDeclaration("0.1", "1.0.0").should.equal("1.0");
            vm.upgradeDependencyDeclaration("1.0", "1.1.0").should.equal("1.1");

            vm.upgradeDependencyDeclaration("1.0.0", "1.0.1").should.equal("1.0.1");
            vm.upgradeDependencyDeclaration("1.0.1", "1.1.0").should.equal("1.1.0");
            vm.upgradeDependencyDeclaration("2.0.1", "2.0.11").should.equal("2.0.11");
        });

        it('wildcard upgrades', function () {
            vm.upgradeDependencyDeclaration("1.x", "1.1.0").should.equal("1.x");
            vm.upgradeDependencyDeclaration("1.x.1", "1.1.2").should.equal("1.x.2");
            vm.upgradeDependencyDeclaration("1.0.x", "1.1.1").should.equal("1.1.x");
            vm.upgradeDependencyDeclaration("1.0.x", "1.1.0").should.equal("1.1.x");
            vm.upgradeDependencyDeclaration("1.0.x", "2.0.0").should.equal("2.0.x");

            vm.upgradeDependencyDeclaration("*", "1.0.0").should.equal("*");
            vm.upgradeDependencyDeclaration("1.*", "2.0.1").should.equal("2.*");
        });

        it('should convert < to ^', function () {
            vm.upgradeDependencyDeclaration("<1.0", "1.1.0").should.equal("^1.1");
        });

        it('should preserve > and >=', function () {
            vm.upgradeDependencyDeclaration(">1.0", "2.0.0").should.equal(">2.0");
            vm.upgradeDependencyDeclaration(">=1.0", "2.0.0").should.equal(">=2.0");
        });

        it('should preserve ^ and ~', function () {
            vm.upgradeDependencyDeclaration("^1.2.3", "1.2.4").should.equal("^1.2.4");
            vm.upgradeDependencyDeclaration("~1.2.3", "1.2.4").should.equal("~1.2.4");
        });

        it('should replace multiple ranges with ^', function () {
            vm.upgradeDependencyDeclaration(">1.0 >2.0 < 3.0", "3.1.0").should.equal("^3.1");
        });

        it('should handle ||', function () {
            vm.upgradeDependencyDeclaration("~1.0 || ~1.2", "3.1.0").should.equal("~3.1");
        });

        it('should use the range with the fewest parts if there are multiple ranges', function () {
            vm.upgradeDependencyDeclaration("1.1 || 1.2.0", "3.1.0").should.equal("3.1");
            vm.upgradeDependencyDeclaration("1.2.0 || 1.1", "3.1.0").should.equal("3.1");
        });

        it('should preserve wildcards in comparisons', function () {
            vm.upgradeDependencyDeclaration("1.x < 1.2.0", "3.1.0").should.equal("3.x");
        });

        it('should use the first operator if a comparison has mixed operators', function () {
            vm.upgradeDependencyDeclaration("1.x < 1.*", "3.1.0").should.equal("3.x");
        });

        it('maintain "unclean" semantic versions', function () {
            vm.upgradeDependencyDeclaration("v1.0", "1.1").should.equal("v1.1");
            vm.upgradeDependencyDeclaration("=v1.0", "1.1").should.equal("=v1.1");
            vm.upgradeDependencyDeclaration(" =v1.0", "1.1").should.equal("=v1.1");
        });

        it('maintain "unclean" semantic versions', function () {
            vm.upgradeDependencyDeclaration("v1.0", "1.1").should.equal("v1.1");
            vm.upgradeDependencyDeclaration("=v1.0", "1.1").should.equal("=v1.1");
            vm.upgradeDependencyDeclaration(" =v1.0", "1.1").should.equal("=v1.1");
        });

        it('maintain existing version if new version is unknown', function () {
            vm.upgradeDependencyDeclaration("1.0", "").should.equal("1.0");
            vm.upgradeDependencyDeclaration("1.0", null).should.equal("1.0");
        });
    });

    describe('updatePackageData', function() {
        it('should upgrade the dependencies in the given package data', function() {
            var pkgData = JSON.stringify({
              "name": "npm-check-updates",
              "dependencies": {
                "bluebird": "<2.0"
              },
              "devDependencies": {
                "mocha": "^1"
              }
            });
            var oldDependencies = {
                "bluebird": "<2.0",
                "mocha": "^1"
            };
            var newDependencies = {
                "bluebird": "^2.9",
                "mocha": "^2"
            };
            JSON.parse(vm.updatePackageData(pkgData, oldDependencies, newDependencies))
            .should.eql({
              "name": "npm-check-updates",
              "dependencies": {
                "bluebird": "^2.9"
              },
              "devDependencies": {
                "mocha": "^2"
              }
            })
        });
    });

    describe('getCurrentDependencies', function() {

        var deps;
        beforeEach(function() {
            deps = {
                dependencies: {
                    mocha: '1.2'
                },
                devDependencies: {
                    lodash: '^3.9.3'
                }
            };
        })

        it('should return an empty object for an empty package.json and handle default options', function() {
            vm.getCurrentDependencies().should.eql({});
            vm.getCurrentDependencies({}).should.eql({});
            vm.getCurrentDependencies({}, {}).should.eql({});
        });

        it('should get dependencies and devDependencies by default', function() {
            vm.getCurrentDependencies(deps).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
        });

        it('should only get dependencies when the prod option is true', function() {
            vm.getCurrentDependencies(deps, { prod: true }).should.eql({
                mocha: '1.2'
            });
        });

        it('should only get devDependencies when the dev option is true', function() {
            vm.getCurrentDependencies(deps, { dev: true }).should.eql({
                lodash: '^3.9.3'
            });
        });

        it('should filter dependencies by package name', function() {
            vm.getCurrentDependencies(deps, { filter: 'mocha' }).should.eql({
                mocha: '1.2'
            });
        });

        it('should not filter out dependencies with a partial package name', function() {
            vm.getCurrentDependencies(deps, { filter: 'o' }).should.eql({});
        });

        it('should filter dependencies by multiple packages', function() {
            vm.getCurrentDependencies(deps, { filter: 'mocha lodash' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
            vm.getCurrentDependencies(deps, { filter: 'mocha,lodash' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
            vm.getCurrentDependencies(deps, { filter: ['mocha', 'lodash'] }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
        });

        it('should filter dependencies by regex', function() {
            vm.getCurrentDependencies(deps, { filter: /o/ }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
            vm.getCurrentDependencies(deps, { filter: '/o/' }).should.eql({
                mocha: '1.2',
                lodash: '^3.9.3'
            });
        });

    });

    describe('upgradeDependencies', function() {

        it('should upgrade simple versions', function() {
            vm.upgradeDependencies({ mongodb: '0.5' }, { mongodb: '1.4.30' }).should.eql({ mongodb: '1.4' });
        });

        it('should not upgrade latest versions that already satisfy the specified version', function() {
            vm.upgradeDependencies({ mongodb: '^1.0.0' }, { mongodb: '1.4.30' }).should.eql({});
        });

        it('should upgrade latest versions that already satisfy the specified version if force option is specified', function() {
            vm.upgradeDependencies({ mongodb: '^1.0.0' }, { mongodb: '1.4.30' }, { force: true }).should.eql({
                mongodb: '^1.4.30'
            });
        });

        it('should not downgrade', function() {
            vm.upgradeDependencies({ mongodb: '^2.0.7' }, { mongodb: '1.4.30' }).should.eql({});
        });

        it('should use the preferred wildcard when converting <, closed, or mixed ranges', function() {
            vm.upgradeDependencies({ a: '1.*', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
            vm.upgradeDependencies({ a: '1.x', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.x' });
            vm.upgradeDependencies({ a: '~1', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '~3.0' });
            vm.upgradeDependencies({ a: '^1', mongodb: '<1.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '^3.0' });

            vm.upgradeDependencies({ a: '1.*', mongodb: '1.0 < 2.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
            vm.upgradeDependencies({ mongodb: '1.0 < 2.*' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '3.*' });
        });
        it('should convert closed ranges to caret (^) when preferred wildcard is unknown', function() {
            vm.upgradeDependencies({ mongodb: '1.0 < 2.0' }, { mongodb: '3.0.0' }).should.eql({ mongodb: '^3.0' });
        });
    });

    describe('getInstalledPackages', function () {
        it('should execute npm ls', function () {
            return vm.getInstalledPackages()
                .should.be.resolved;
        });
    });

    describe('getLatestPackageVersion', function () {
        return it('valid package info', function () {
            return vm.getLatestPackageVersion("bootstrap")
                .should.eventually.be.a('string');
        });
    });

    describe('getGreatestPackageVersion', function () {
        it('valid package info', function () {
            return vm.getGreatestPackageVersion("bootstrap")
                .should.eventually.be.a('string');
        });
    });

    describe('getLatestVersions', function () {
        it('valid single package', function () {
            var latestVersions = vm.getLatestVersions(["bootstrap"]);
            return latestVersions.should.eventually.have.property('bootstrap');
        });

        it('valid packages', function () {
            var latestVersions = vm.getLatestVersions(["bootstrap", "angular"]);
            latestVersions.should.eventually.have.property('bootstrap');
            latestVersions.should.eventually.have.property('angular');
            return latestVersions;
        });

        it('unavailable packages should be ignored', function () {
            return vm.getLatestVersions(["sudoMakeMeASandwitch"])
                .should.eventually.deep.equal({})
        });

        it('set the versionTarget explicitly to latest', function () {
            return vm.getLatestVersions(["bootstrap"], { versionTarget: 'latest' })
                .should.eventually.have.property('bootstrap');
        });

        it('set the versionTarget to greatest', function () {
            return vm.getLatestVersions(["bootstrap"], { versionTarget: 'greatest' })
                .should.eventually.have.property('bootstrap');
        });

        it('should return an error for an unsupported versionTarget', function () {
            var a = vm.getLatestVersions(["bootstrap"], { versionTarget: 'foo' });
            return a.should.be.rejected;
        });

    });

    describe("isUpgradeable", function() {

        it("should upgrade versions that do not satisfy latest versions", function() {
            vm.isUpgradeable("0.1.x", "0.5.1").should.equal(true);
        });

        it("should not upgrade invalid versions", function() {
            vm.isUpgradeable("https://github.com/strongloop/express", "4.11.2").should.equal(false);
        });

        it("should not upgrade versions beyond the latest", function() {
            vm.isUpgradeable("5.0.0", "4.11.2").should.equal(false);
        });

        it("should handle comparison constraints", function() {
            vm.isUpgradeable(">1.0", "0.5.1").should.equal(false);
            vm.isUpgradeable("<3.0 >0.1", "0.5.1").should.equal(false);
            vm.isUpgradeable(">0.1.x", "0.5.1").should.equal(false);
        });

    });

    describe('getPreferredWildcard', function() {

        it('should identify ^ when it is preferred', function() {
            var deps = {
                bootstrap: '^0.9.0',
                bluebird: '^2.9.27',
                cint: '^8.2.1',
                commander: '~2.8.1',
                lodash: '^3.2.0'
            };
            vm.getPreferredWildcard(deps).should.equal('^');
        });

        it('should identify ~ when it is preferred', function() {
            var deps = {
                bootstrap: '~3.0.0',
                bluebird: '~2.9.27',
                cint: '^8.2.1',
                commander: '~2.8.1',
                lodash: '^3.2.0'
            };
            vm.getPreferredWildcard(deps).should.equal('~');
        });

        it('should identify .x when it is preferred', function() {
            var deps = {
                bootstrap: '3.0.x',
                bluebird: '2.9.x',
                cint: '^8.2.1',
                commander: '~2.8.1',
                lodash: '3.x'
            };
            vm.getPreferredWildcard(deps).should.equal('.x');
        });

        it('should identify .* when it is preferred', function() {
            var deps = {
                bootstrap: '3.0.*',
                bluebird: '2.9.*',
                cint: '^8.2.1',
                commander: '~2.8.1',
                lodash: '3.*'
            };
            vm.getPreferredWildcard(deps).should.equal('.*');
        });

        it('should use the first wildcard if there is a tie', function() {
            var deps = {
                bootstrap: '3.0.x',
                commander: '2.8.*'
            };
            vm.getPreferredWildcard(deps).should.equal('.x');
        });

        it('should default to caret (^) when cannot be determined from other dependencies', function() {
            var deps = {
                bootstrap: '3.0.0',
                commander: '2.8.1',
                lodash: '3.2.0'
            };
            vm.getPreferredWildcard(deps).should.equal('^');
        });
    });

});
