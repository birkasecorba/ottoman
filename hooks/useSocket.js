"use strict";
exports.__esModule = true;
var react_1 = require("react");
var socket_io_client_1 = require("socket.io-client");
var socket = socket_io_client_1["default"]();
function useSocket(cb) {
    var _a = react_1.useState(null), activeSocket = _a[0], setActiveSocket = _a[1];
    react_1.useEffect(function () {
        if (activeSocket || !socket)
            return;
        if (cb) {
            cb(socket);
        }
        setActiveSocket(socket);
        // eslint-disable-next-line consistent-return
        return function () {
            socket.off('message.chat1');
        };
    }, [socket]);
    return activeSocket;
}
exports["default"] = useSocket;
