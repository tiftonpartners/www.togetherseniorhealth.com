/**
 * io_client.js
 *
 * Purpose:
 *
 * Description:
 *
 * History:
 *    2020/5/29, Created by jumperchen
 *
 * Copyright (C) 2020 Potix Corporation. All Rights Reserved.
 */
'use strict';
var socket = require('socket.io-client')('http://localhost:3000/im/agent', {
    transport: ['websocket']
});
socket.on('connect', function(){console.log('connect'); socket.emit('msg', 'hi')});
socket.on('connect_error', function(){console.log('connect_error')});
socket.on('event', function(data){});
socket.on('disconnect', function(){console.log('disconnect')});