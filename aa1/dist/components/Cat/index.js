'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Cat;

var _ReactWX = require('../../ReactWX');

var _ReactWX2 = _interopRequireDefault(_ReactWX);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Cat(props) {
    var h = _ReactWX2.default.createElement;

    return h('view', null, 'Cat: ', props.id, '_', props.content);;
} // eslint-disable-next-line