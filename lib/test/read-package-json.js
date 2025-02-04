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
const path = __importStar(require("path"));
const chai_1 = require("chai");
const read_package_json_1 = require("../src/read-package-json");
describe('read-package-json', () => {
    it('should find a package.json file from the given directory', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (0, chai_1.expect)(await (0, read_package_json_1.readPackageJson)(path.resolve(__dirname, '..'))).to.deep.equal(require('../package.json'));
    });
});
//# sourceMappingURL=read-package-json.js.map