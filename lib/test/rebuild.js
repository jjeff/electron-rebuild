"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const module_setup_1 = require("./helpers/module-setup");
const rebuild_1 = require("./helpers/rebuild");
const electron_version_1 = require("./helpers/electron-version");
const rebuild_2 = require("../src/rebuild");
const testElectronVersion = (0, electron_version_1.getExactElectronVersionSync)();
describe('rebuilder', () => {
    const testModulePath = path.resolve(os.tmpdir(), 'electron-rebuild-test');
    describe('core behavior', function () {
        this.timeout(module_setup_1.TIMEOUT_IN_MILLISECONDS);
        before(async () => {
            await (0, module_setup_1.resetTestModule)(testModulePath);
            process.env.ELECTRON_REBUILD_TESTS = 'true';
            await (0, rebuild_2.rebuild)({
                buildPath: testModulePath,
                electronVersion: testElectronVersion,
                arch: process.arch
            });
        });
        it('should have rebuilt top level prod dependencies', async () => {
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'ref-napi');
        });
        it('should have rebuilt top level prod dependencies that are using prebuild', async () => {
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'farmhash');
        });
        it('should have rebuilt children of top level prod dependencies', async () => {
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'leveldown');
        });
        it('should have rebuilt children of scoped top level prod dependencies', async () => {
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, '@newrelic/native-metrics');
        });
        it('should have rebuilt top level optional dependencies', async () => {
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'bcrypt');
        });
        it('should not have rebuilt top level devDependencies', async () => {
            await (0, rebuild_1.expectNativeModuleToNotBeRebuilt)(testModulePath, 'ffi-napi');
        });
        it('should not download files in the module directory', async () => {
            const modulePath = path.resolve(testModulePath, 'node_modules/ref-napi');
            const fileNames = await fs.readdir(modulePath);
            (0, chai_1.expect)(fileNames).to.not.contain(testElectronVersion);
        });
        after(async () => {
            delete process.env.ELECTRON_REBUILD_TESTS;
            await (0, module_setup_1.cleanupTestModule)(testModulePath);
        });
    });
    describe('force rebuild', function () {
        this.timeout(module_setup_1.TIMEOUT_IN_MILLISECONDS);
        before(async () => await (0, module_setup_1.resetTestModule)(testModulePath));
        after(async () => await (0, module_setup_1.cleanupTestModule)(testModulePath));
        afterEach(module_setup_1.resetMSVSVersion);
        const buildPath = testModulePath;
        const electronVersion = testElectronVersion;
        const arch = process.arch;
        const extraModules = [];
        it('should skip the rebuild step when disabled', async () => {
            await (0, rebuild_2.rebuild)({ buildPath, electronVersion, arch });
            (0, module_setup_1.resetMSVSVersion)();
            const rebuilder = (0, rebuild_2.rebuild)({ buildPath, electronVersion, arch, extraModules, force: false });
            let skipped = 0;
            rebuilder.lifecycle.on('module-skip', () => {
                skipped++;
            });
            await rebuilder;
            (0, chai_1.expect)(skipped).to.equal(6);
        });
        it('should rebuild all modules again when disabled but the electron ABI changed', async () => {
            await (0, rebuild_2.rebuild)({ buildPath, electronVersion, arch });
            (0, module_setup_1.resetMSVSVersion)();
            const rebuilder = (0, rebuild_2.rebuild)({ buildPath, electronVersion: '3.0.0', arch, extraModules, force: false });
            let skipped = 0;
            rebuilder.lifecycle.on('module-skip', () => {
                skipped++;
            });
            await rebuilder;
            (0, chai_1.expect)(skipped).to.equal(0);
        });
        it('should rebuild all modules again when enabled', async function () {
            if (process.platform === 'darwin') {
                this.timeout(5 * module_setup_1.MINUTES_IN_MILLISECONDS);
            }
            await (0, rebuild_2.rebuild)({ buildPath, electronVersion, arch });
            (0, module_setup_1.resetMSVSVersion)();
            const rebuilder = (0, rebuild_2.rebuild)({ buildPath, electronVersion, arch, extraModules, force: true });
            let skipped = 0;
            rebuilder.lifecycle.on('module-skip', () => {
                skipped++;
            });
            await rebuilder;
            (0, chai_1.expect)(skipped).to.equal(0);
        });
    });
    describe('only rebuild', function () {
        this.timeout(2 * module_setup_1.MINUTES_IN_MILLISECONDS);
        beforeEach(async () => await (0, module_setup_1.resetTestModule)(testModulePath));
        afterEach(async () => await (0, module_setup_1.cleanupTestModule)(testModulePath));
        it('should rebuild only specified modules', async () => {
            const nativeModuleBinary = path.join(testModulePath, 'node_modules', 'native-hello-world', 'build', 'Release', 'hello_world.node');
            (0, chai_1.expect)(await fs.pathExists(nativeModuleBinary)).to.be.true;
            await fs.remove(nativeModuleBinary);
            (0, chai_1.expect)(await fs.pathExists(nativeModuleBinary)).to.be.false;
            const rebuilder = (0, rebuild_2.rebuild)({
                buildPath: testModulePath,
                electronVersion: testElectronVersion,
                arch: process.arch,
                onlyModules: ['native-hello-world'],
                force: true
            });
            let built = 0;
            rebuilder.lifecycle.on('module-done', () => built++);
            await rebuilder;
            (0, chai_1.expect)(built).to.equal(1);
            (0, chai_1.expect)(await fs.pathExists(nativeModuleBinary)).to.be.true;
        });
        it('should rebuild multiple specified modules via --only option', async () => {
            const rebuilder = (0, rebuild_2.rebuild)({
                buildPath: testModulePath,
                electronVersion: testElectronVersion,
                arch: process.arch,
                onlyModules: ['ffi-napi', 'ref-napi'],
                force: true
            });
            let built = 0;
            rebuilder.lifecycle.on('module-done', () => built++);
            await rebuilder;
            (0, chai_1.expect)(built).to.equal(2);
        });
    });
    describe('debug rebuild', function () {
        this.timeout(10 * module_setup_1.MINUTES_IN_MILLISECONDS);
        before(async () => await (0, module_setup_1.resetTestModule)(testModulePath));
        after(async () => await (0, module_setup_1.cleanupTestModule)(testModulePath));
        it('should have rebuilt ffi-napi module in Debug mode', async () => {
            await (0, rebuild_2.rebuild)({
                buildPath: testModulePath,
                electronVersion: testElectronVersion,
                arch: process.arch,
                onlyModules: ['ffi-napi'],
                force: true,
                debug: true
            });
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'ffi-napi', { buildType: 'Debug' });
            await (0, rebuild_1.expectNativeModuleToNotBeRebuilt)(testModulePath, 'ffi-napi');
        });
    });
    describe('useElectronClang rebuild', function () {
        this.timeout(10 * module_setup_1.MINUTES_IN_MILLISECONDS);
        before(async () => await (0, module_setup_1.resetTestModule)(testModulePath));
        after(async () => await (0, module_setup_1.cleanupTestModule)(testModulePath));
        it('should have rebuilt ffi-napi module using clang mode', async () => {
            await (0, rebuild_2.rebuild)({
                buildPath: testModulePath,
                electronVersion: testElectronVersion,
                arch: process.arch,
                onlyModules: ['ffi-napi'],
                force: true,
                useElectronClang: true
            });
            await (0, rebuild_1.expectNativeModuleToBeRebuilt)(testModulePath, 'ffi-napi');
        });
    });
});
//# sourceMappingURL=rebuild.js.map