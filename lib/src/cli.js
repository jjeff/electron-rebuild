#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("colors");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ora = require("ora");
const yargs_1 = __importDefault(require("yargs/yargs"));
const search_module_1 = require("./search-module");
const electron_locator_1 = require("./electron-locator");
const rebuild_1 = require("./rebuild");
const argv = (0, yargs_1.default)(process.argv.slice(2)).version(false).options({
    version: { alias: 'v', type: 'string', description: 'The version of Electron to build against' },
    force: { alias: 'f', type: 'boolean', description: 'Force rebuilding modules, even if we would skip it otherwise' },
    arch: { alias: 'a', type: 'string', description: "Override the target architecture to something other than your system's" },
    'module-dir': { alias: 'm', type: 'string', description: 'The path to the node_modules directory to rebuild' },
    // TODO: should be type: array
    'which-module': { alias: 'w', type: 'string', description: 'A specific module to build, or comma separated list of modules. Modules will only be rebuilt if they also match the types of dependencies being rebuilt (see --types).' },
    // TODO: should be type: array
    only: { alias: 'o', type: 'string', description: 'Only build specified module, or comma separated list of modules. All others are ignored.' },
    'electron-prebuilt-dir': { alias: 'e', type: 'string', description: 'The path to the prebuilt electron module' },
    'dist-url': { alias: 'd', type: 'string', description: 'Custom header tarball URL' },
    // TODO: should be type: array
    types: { alias: 't', type: 'string', description: 'The types of dependencies to rebuild.  Comma separated list of "prod", "dev" and "optional".  Default is "prod,optional"' },
    parallel: { alias: 'p', type: 'boolean', description: 'Rebuild in parallel, this is enabled by default on macOS and Linux' },
    sequential: { alias: 's', type: 'boolean', description: 'Rebuild modules sequentially, this is enabled by default on Windows' },
    debug: { alias: 'b', type: 'boolean', description: 'Build debug version of modules' },
    'prebuild-tag-prefix': { type: 'string', description: 'GitHub tag prefix passed to prebuild-install. Default is "v"' },
    'force-abi': { type: 'number', description: 'Override the ABI version for the version of Electron you are targeting.  Only use when targeting Nightly releases.' },
    'use-electron-clang': { type: 'boolean', description: 'Use the clang executable that Electron used when building its binary. This will guarantee compiler compatibility' },
    'disable-pre-gyp-copy': { type: 'boolean', description: 'Disables the pre-gyp copy step' },
}).usage('Usage: $0 --version [version] --module-dir [path]')
    .help()
    .alias('help', 'h')
    .epilog('Copyright 2016-2021')
    .parseSync();
if (process.argv.length === 3 && process.argv[2] === '--version') {
    /* eslint-disable @typescript-eslint/no-var-requires */
    try {
        console.log('Electron Rebuild Version:', require(path.resolve(__dirname, '../../package.json')).version);
    }
    catch (err) {
        console.log('Electron Rebuild Version:', require(path.resolve(__dirname, '../package.json')).version);
    }
    /* eslint-enable @typescript-eslint/no-var-requires */
    process.exit(0);
}
const handler = (err) => {
    console.error('\nAn unhandled error occurred inside electron-rebuild'.red);
    console.error(`${err.message}\n\n${err.stack}`.red);
    process.exit(-1);
};
process.on('uncaughtException', handler);
process.on('unhandledRejection', handler);
(async () => {
    const projectRootPath = await (0, search_module_1.getProjectRootPath)(process.cwd());
    const electronModulePath = argv.e ? path.resolve(process.cwd(), argv.e) : await (0, electron_locator_1.locateElectronModule)(projectRootPath);
    let electronModuleVersion = argv.v;
    if (!electronModuleVersion) {
        try {
            if (!electronModulePath)
                throw new Error('Prebuilt electron module not found');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pkgJson = require(path.join(electronModulePath, 'package.json'));
            electronModuleVersion = pkgJson.version;
        }
        catch (e) {
            throw new Error(`Unable to find electron's version number, either install it or specify an explicit version`);
        }
    }
    let rootDirectory = argv.m;
    if (!rootDirectory) {
        // NB: We assume here that we're going to rebuild the immediate parent's
        // node modules, which might not always be the case but it's at least a
        // good guess
        rootDirectory = path.resolve(__dirname, '../../..');
        if (!await fs.pathExists(rootDirectory) || !await fs.pathExists(path.resolve(rootDirectory, 'package.json'))) {
            // Then we try the CWD
            rootDirectory = process.cwd();
            if (!await fs.pathExists(rootDirectory) || !await fs.pathExists(path.resolve(rootDirectory, 'package.json'))) {
                throw new Error('Unable to find parent node_modules directory, specify it via --module-dir, E.g. "--module-dir ." for the current directory');
            }
        }
    }
    else {
        rootDirectory = path.resolve(process.cwd(), rootDirectory);
    }
    if (argv.forceAbi && typeof argv.forceAbi !== 'number') {
        throw new Error('force-abi must be a number');
    }
    let modulesDone = 0;
    let moduleTotal = 0;
    const rebuildSpinner = ora('Searching dependency tree').start();
    let lastModuleName;
    const redraw = (moduleName) => {
        if (moduleName)
            lastModuleName = moduleName;
        if (argv.p) {
            rebuildSpinner.text = `Building modules: ${modulesDone}/${moduleTotal}`;
        }
        else {
            rebuildSpinner.text = `Building module: ${lastModuleName}, Completed: ${modulesDone}`;
        }
    };
    const rebuilder = (0, rebuild_1.rebuild)({
        buildPath: rootDirectory,
        electronVersion: electronModuleVersion,
        arch: argv.a || process.arch,
        extraModules: argv.w ? argv.w.split(',') : [],
        onlyModules: argv.o ? argv.o.split(',') : null,
        force: argv.f,
        headerURL: argv.d,
        types: argv.t ? argv.t.split(',') : ['prod', 'optional'],
        mode: argv.p ? 'parallel' : (argv.s ? 'sequential' : undefined),
        debug: argv.debug,
        prebuildTagPrefix: argv.prebuildTagPrefix || 'v',
        forceABI: argv.forceAbi,
        useElectronClang: !!argv.useElectronClang,
        disablePreGypCopy: !!argv.disablePreGypCopy,
        projectRootPath,
    });
    const lifecycle = rebuilder.lifecycle;
    lifecycle.on('module-found', (moduleName) => {
        moduleTotal += 1;
        redraw(moduleName);
    });
    lifecycle.on('module-done', () => {
        modulesDone += 1;
        redraw();
    });
    try {
        await rebuilder;
    }
    catch (err) {
        rebuildSpinner.text = 'Rebuild Failed';
        rebuildSpinner.fail();
        throw err;
    }
    rebuildSpinner.text = 'Rebuild Complete';
    rebuildSpinner.succeed();
})();
//# sourceMappingURL=cli.js.map