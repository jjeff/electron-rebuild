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
const electron_locator_1 = require("../src/electron-locator");
const baseFixtureDir = path.resolve(__dirname, 'fixture', 'electron-locator');
async function expectElectronCanBeFound(projectRootPath, startDir) {
    it('should return a valid path', async () => {
        const electronPath = await (0, electron_locator_1.locateElectronModule)(projectRootPath, startDir);
        (0, chai_1.expect)(electronPath).to.be.a('string');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (0, chai_1.expect)(await fs.pathExists(electronPath)).to.be.equal(true);
    });
}
describe('locateElectronModule', () => {
    describe('when electron is not installed', () => {
        const electronDir = path.resolve(__dirname, '..', 'node_modules', 'electron');
        before(async () => {
            await fs.rename(electronDir, `${electronDir}-moved`);
        });
        it('should return null when electron is not installed', async () => {
            const fixtureDir = path.join(baseFixtureDir, 'not-installed');
            (0, chai_1.expect)(await (0, electron_locator_1.locateElectronModule)(fixtureDir, fixtureDir)).to.be.equal(null);
        });
        after(async () => {
            await fs.rename(`${electronDir}-moved`, electronDir);
        });
    });
    describe('using require.resolve() in the current project to search', () => {
        const fixtureDir = path.join(baseFixtureDir, 'not-installed');
        expectElectronCanBeFound(fixtureDir, fixtureDir);
    });
    describe('with electron-prebuilt-compile installed', () => {
        const fixtureDir = path.join(baseFixtureDir, 'prebuilt-compile');
        expectElectronCanBeFound(fixtureDir, fixtureDir);
    });
    describe('with electron installed', () => {
        const fixtureDir = path.join(baseFixtureDir, 'single');
        expectElectronCanBeFound(fixtureDir, fixtureDir);
        describe('in a workspace', () => {
            const fixtureDir = path.join(baseFixtureDir, 'workspace');
            expectElectronCanBeFound(fixtureDir, path.join(fixtureDir, 'packages', 'descendant'));
        });
    });
});
//# sourceMappingURL=electron-locator.js.map