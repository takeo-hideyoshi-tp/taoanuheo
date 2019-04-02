module.exports = {
    'box-sizing': true,
    'overflow': true,
    'box-shadow': true,
    'letter-spacing': true,
    'min-height': true,
    'transition': true,
    'vertical-align': true,
    'white-space': true,
    'max-height': true,
    'float': true,
    'clear': true,
    'min-width': true,
    'max-width': true,
    'flex-flow': true,
    'word-break': true,
    'word-wrap': true,
    'zoom': true,
    'box-flex': true,
    'background-clip': true,
    'outline': true,
    'line-clamp': true,
    'text-shadow': true,
    'appearance': true,
    'overflow-y': true,
    display: function (value) {
        return !(value === 'flex' || value === 'none');
    },
    'font-weight': function(value) {
        return !(value === 'normal' || value === 'bold');
    },
    'align-items': function(value) {
        let rule = /stretch|flex-start|flex-end|center/i;
        return !rule.test(value);
    },
    'animation-fill-mode': function(value) {
        // none | forwards
        return !(value === 'none' || value === 'forwards');
    },
    'flex': function(value) {
        return !(parseInt(value) == value);
    }
};