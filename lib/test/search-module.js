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
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const search_module_1 = require("../src/search-module");
let baseDir;
async function createTempDir() {
    baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'electron-rebuild-test-'));
}
async function removeTempDir() {
    await fs.remove(baseDir);
}
describe('search-module', () => {
    describe('getProjectRootPath', () => {
        describe('multi-level workspace', () => {
            for (const lockFile of ['yarn.lock', 'package-lock.json']) {
                describe(lockFile, () => {
                    before(async () => {
                        await createTempDir();
                        await fs.copy(path.resolve(__dirname, 'fixture', 'multi-level-workspace'), baseDir);
                        await fs.ensureFile(path.join(baseDir, lockFile));
                    });
                    it('finds the folder with the lockfile', async () => {
                        const packageDir = path.join(baseDir, 'packages', 'bar');
                        (0, chai_1.expect)(await (0, search_module_1.getProjectRootPath)(packageDir)).to.equal(baseDir);
                    });
                    after(removeTempDir);
                });
            }
        });
        describe('no workspace', () => {
            before(createTempDir);
            it('returns the input directory if a lockfile cannot be found', async () => {
                (0, chai_1.expect)(await (0, search_module_1.getProjectRootPath)(baseDir)).to.equal(baseDir);
            });
            after(removeTempDir);
        });
    });
});
//# sourceMappingURL=search-module.js.map