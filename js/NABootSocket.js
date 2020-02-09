;(function () {
    "use strict"
    let _global;

    const CODE = {
        success: 200,
        failure: -1
    };

    const CENTER_SERVER = 'http://35.243.101.217:9510';
    const SOCKET_ENDPOINT = '/boostimsocket';

    const URL = {
        register: CENTER_SERVER + '/access/register',
        login: CENTER_SERVER + '/access/login',
        logout: CENTER_SERVER + '/access/logout',
        getNodeAddress: CENTER_SERVER + '/node/get/best',
        connectNode: CENTER_SERVER + '/node/connect',
        userInfoURL: CENTER_SERVER + '/user/get/info',
        conversationListURL: CENTER_SERVER + '/conversation/get/list/',
        historyRecordListURL: CENTER_SERVER + '/history/get/',
        clearUnread: CENTER_SERVER + '/conversation/clear/unread'
    };

    const SUBSCRIBE = {
        privateChannel: '/user/private/message',
        groupChannel: '/user/group/message',
        notifyChannel: '/user/notify'
    };

    const SEND = {
        privateChannel: '/to/private/send',
        groupChannel: '/to/group/send'
    };

    let globalData = {
        token: '',
        node: {
            id: '',
            address: ''
        }
    };

    let stompClient = null;

    /*NA_ajax({
      type:"POST",
      url:"ajax.php",
      dataType:"json",
      data:{"val1":"abc","val2":123,"val3":"456"},
      beforeSend:function(){
        //some js code
      },
      success:function(msg){
        console.log(msg)
      },
      error:function(){
        console.log("error")
      }
    })*/
    function NA_ajax(){
        let ajaxData = {
            type:arguments[0].type || "GET",
            url:arguments[0].url || "",
            async:arguments[0].async || "true",
            data:arguments[0].data || null,
            dataType:arguments[0].dataType || "text",
            contentType:arguments[0].contentType || "application/x-www-form-urlencoded",
            beforeSend:arguments[0].beforeSend || function(){},
            success:arguments[0].success || function(){},
            error:arguments[0].error || function(){}
        }
        let xhr = createxmlHttpRequest();
        xhr.responseType=ajaxData.dataType;
        xhr.open(ajaxData.type,ajaxData.url,ajaxData.async);
        ajaxData.beforeSend(xhr)
        xhr.setRequestHeader("Content-Type",ajaxData.contentType);
        xhr.send(convertData(ajaxData.data));
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    ajaxData.success(xhr.response)
                }else{
                    ajaxData.error(xhr.response)
                }
            }
        }
    }

    function createxmlHttpRequest() {
        if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    }

    function convertData(data){
        if( typeof data === 'object' ){
            let convertResult = "" ;
            for(let c in data){
                convertResult+= c + "=" + data[c] + "&";
            }
            convertResult=convertResult.substring(0,convertResult.length-1)
            return convertResult;
        }else{
            return data;
        }
    }

    let NABootSocket = {
        AuthRegister: function(NA_username,NA_password) {
            this.username = NA_username
            this.password = NA_password
        },
        AuthLogin: function(NA_username,NA_password) {
            this.username = NA_username
            this.password = NA_password
        },
        Message: function (NA_sender,NA_receiver,NA_content) {
            this.sender = NA_sender
            this.receiver = NA_receiver
            this.content = NA_content
        },
        ConnectCallbacks: function() {
            this.onSuccess = arguments[0].onSuccess,
            this.onFailure = arguments[0].onFailure,
            this.onReceivedPrivate = arguments[0].onReceivedPrivate,
            this.onReceivedGroup = arguments[0].onReceivedGroup,
            this.onReceivedNotify = arguments[0].onReceivedNotify
        },

        sendPrivateMessage: function (NA_msg) {
            stompClient.send(SEND.privateChannel, {}, JSON.stringify(NA_msg));
        },
        sendGroupMessage: function (NA_msg) {
            stompClient.send(SEND.groupChannel, {}, JSON.stringify(NA_msg));
        },
        register: function (NA_authRegister) {
            NA_ajax({
                type:"POST",
                url:URL.register,
                dataType:"json",
                data:JSON.stringify(NA_authRegister),
                contentType:'application/json',
                success:function(data){
                    console.log(data.message)
                },
                error:function(){
                    console.log("register error")
                }
            })
        },
        connect: function (NA_authLogin,NA_connectCallbacks) {
            // Login by HTTP request to obtain token
            NA_ajax({
                type:"POST",
                url:URL.login,
                dataType:"json",
                data:JSON.stringify(NA_authLogin),
                contentType:'application/json',
                success:function(data){
                    if (data.code === CODE.success) {
                        globalData.token = data.data;
                        console.log('Login successfully with token:');
                        console.log(globalData.token);
                        NABootSocket.getNodeAddress(NA_connectCallbacks);
                    } else {
                        alert(data.message);
                    }
                },
                error:function(){
                    console.log("connect error")
                }
            })
        },
        getNodeAddress: function (NA_connectCallbacks) {
            NA_ajax({
                type:"GET",
                url:URL.getNodeAddress,
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(data){
                    if (data.code === CODE.success) {
                        globalData.node = data.data;
                        console.log('Obtain node successfully:');
                        console.log(globalData.node);
                        NABootSocket.connectNode(NA_connectCallbacks);
                    } else {
                        alert(data.message);
                    }
                },
                error:function(){
                    console.log("getNodeAddress error")
                }
            })
        },
        connectNode: function (NA_connectCallbacks) {
            let success = arguments[0].onSuccess || function() {}
            let failure = arguments[0].onFailure || function() {}
            let receivePrivate = arguments[0].onReceivedPrivate || function() {}
            let receiveGroup = arguments[0].onReceivedGroup || function() {}
            let receiveNotify = arguments[0].onReceivedNotify || function() {}

            const socket = new SockJS(globalData.node.address + SOCKET_ENDPOINT);
            stompClient = Stomp.over(socket);

            stompClient.connect({}, function () {
                // Parse session id
                const urlSlice = stompClient.ws._transport.url.split('/');
                const sessionId = urlSlice[urlSlice.length - 2];

                // Connect the node
                NA_ajax({
                    type:"POST",
                    url:URL.connectNode + '/' + globalData.node.id + '/' + sessionId,
                    dataType:"json",
                    beforeSend:function(xhr){
                        xhr.setRequestHeader("Authorization", globalData.token);
                    },
                    success:function(data){
                        if (data.code === CODE.success) {
                            success(data.data.uuid)
                            console.log('ConnectNode Successful');
                            NABootSocket.subscribeChannel(receivePrivate,receiveGroup,receiveNotify);
                        } else {
                            failure(data.message)
                            disconnect();
                        }
                    },
                    error:function(){
                        console.log("ConnectNode error")
                    }
                })
            });
        },
        subscribeChannel: function (receivePrivate,receiveGroup,receiveNotify) {
            // Subscribe private chat channel
            stompClient.subscribe(SUBSCRIBE.privateChannel, function (data) {
                data = JSON.parse(data.body);
                if (data.code === CODE.success) {
                    const message = data.data;
                    receivePrivate(message)
                } else {
                    alert(data.message)
                }
            });

            // Subscribe group chat channel
            stompClient.subscribe(SUBSCRIBE.groupChannel, function (data) {
                data = JSON.parse(data.body);
                if (data.code === CODE.success) {
                    const message = data.data;
                    receiveGroup(message)
                } else {
                    alert(data.message)
                }
            });

            // Subscribe notify channel
            stompClient.subscribe(SUBSCRIBE.notifyChannel, function (data) {
                data = JSON.parse(data.body);
                if (data.code === CODE.success) {
                    const message = data.data;
                    receiveNotify(message)
                } else {
                    alert(data.message)
                }
            });
        },
        disconnect: function (fn) {
            let func = fn || function() {}
            NABootSocket.logout();
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            func();
            console.log("Disconnected");
        },
        logout: function() {
            NA_ajax({
                type:"POST",
                url:URL.logout,
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(data){
                    if (data.code === CODE.success) {
                        console.log('Logout successfully.');
                    } else {
                        alert(data.message);
                    }
                },
                error:function(){
                    console.log("Logout error")
                }
            })
        },
        getUserInfo: function() {
            NA_ajax({
                type:"GET",
                url:URL.userInfoURL,
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(data){
                    console.log('userInfo:')
                    console.log(data)
                    if(data.data.unreadList) {
                        let conversation = data.data.unreadList.split(',')
                        let conversationKeys = []
                        let conversationKey = []
                        for(let i=0;i<conversation.length;i++) {
                            conversationKeys[i] = conversation[i].split(':')
                            let conversationObject = {
                                uuid: conversationKeys[i][0],
                                num: conversationKeys[i][1]
                            }
                            conversationKey[i] = conversationObject
                        }
                        console.log("unreadList: " + JSON.stringify(conversationKey))
                    }
                },
                error:function(){
                    console.log("getUserInfo error")
                }
            })
        },
        clearUnread: function(NA_conversationUuid) {
            NA_ajax({
                type:"POST",
                url:URL.clearUnread+'?conversationUuid='+NA_conversationUuid,
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(response){
                    console.log('clearUnread:')
                    console.log(response)
                },
                error:function(){
                    console.log("clearUnread error")
                }
            })
        },
        getConversationList: function (NA_uuid) {
            let success = arguments[1].onSuccess || function() {}
            let failure = arguments[1].onFailure || function() {}

            NA_ajax({
                type:"GET",
                url:URL.conversationListURL+NA_uuid,
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(msg){
                    console.log('get conversation list')
                    success(msg.data)
                },
                error:function(msg){
                    console.log('not get conversation list')
                    failure(msg.message)
                }
            })
        },
        getHistoryRecordList: function (NA_uuid) {
            let success = arguments[1].onSuccess || function() {}
            let failure = arguments[1].onFailure || function() {}

            NA_ajax({
                type:"GET",
                url:URL.historyRecordListURL+NA_uuid+'?page=0&size=20',
                dataType:"json",
                beforeSend:function(xhr){
                    xhr.setRequestHeader("Authorization", globalData.token);
                },
                success:function(msg){
                    if(msg.code === 200){
                        console.log('get historyRecord list')
                        success(msg.data)
                    }else {
                        failure(msg.message)
                    }
                },
                error:function(msg){
                    console.log('not get historyRecord list')
                    failure(msg.message)
                }
            })
        }
    }

    _global = (function () { return this || (0, eval)('this'); }());
    if (typeof module !== "undefined" && module.exports) {
        module.exports = NABootSocket;
    } else if (typeof define === "function" && define.amd) {
        define(function () { return NABootSocket; });
    } else {
        !('NABootSocket' in _global) && (_global.NABootSocket = NABootSocket);
    }
}())
