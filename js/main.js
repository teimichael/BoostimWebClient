const CENTER_SERVER = 'http://35.243.101.217:9510';

function connect() {
    let authLogin = new NABootSocket.AuthLogin($('#username').val(),$('#password').val())
    let connectCallbacks = new NABootSocket.ConnectCallbacks({
        onSuccess: function (data) {
            NABootSocket.getUserInfo()
            $('#my-uuid').val(data);
            setConnected(true);
            console.log('Connected');
            NABootSocket.getConversationList(data,{
                onSuccess: function (data) {
                    console.log(data)
                    for(let i=0;i<data.length;i++) {
                        console.log("conversationUuid: "+data[i].uuid)
                        NABootSocket.getHistoryRecordList(data[i].uuid, {
                            onSuccess: function (data) {
                                console.log(data)
                                for (let j = 0; j < data.length; j++) {
                                    showRecord(data[j])
                                }
                            },
                            onFailure: function (data) {
                                console.log(data)
                            }
                        })
                        NABootSocket.clearUnread(data[i].uuid)
                        NABootSocket.getUserInfo()
                    }
                },
                onFailure: function (data) {
                    console.log(data)
                }
            })
            /*NABootSocket.getHistoryRecordList('d198b133-62b3-4e68-973d-efdf97e57a94',{
                onSuccess: function (data) {
                    console.log(data)
                },
                onFailure: function (data) {
                    console.log(data)
                }
            })*/
        },
        onFailure: function (message) {
            alert(message);
            disconnect();
        },
        onReceivedPrivate: function (message) {
            showRecord(message)
        },
        onReceivedGroup: function (message) {
            showRecord(message)
        },
        onReceivedNotify: function (message) {
            showRecord(message)
        }
    })

    NABootSocket.connect(authLogin,connectCallbacks)


    // Login by HTTP request to obtain token
    /*const authLogin = {
        username: $('#username').val(),
        password: $('#password').val()
    };
    $.ajax({
        type: "POST",
        url: URL.login,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(authLogin),
    }).done(function (data) {
        if (data.code === CODE.success) {
            globalData.token = data.data;
            console.log('Login successfully with token:');
            console.log(globalData.token);
            getNodeAddress();
        } else {
            alert(data.message);
        }
    });*/
}

/*function getNodeAddress() {
    $.ajax({
        type: "GET",
        url: URL.getNodeAddress,
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", globalData.token);
        },
    }).done(function (data) {
        if (data.code === CODE.success) {
            globalData.node = data.data;
            console.log('Obtain node successfully:');
            console.log(globalData.node);
            connectNode();
        } else {
            alert(data.message);
        }
    });
}

function connectNode() {
    const socket = new SockJS(globalData.node.address + SOCKET_ENDPOINT);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function () {
        // Parse session id
        const urlSlice = stompClient.ws._transport.url.split('/');
        const sessionId = urlSlice[urlSlice.length - 2];

        // Connect the node
        $.ajax({
            type: "POST",
            url: URL.connectNode + '/' + globalData.node.id + '/' + sessionId,
            dataType: 'json',
            contentType: 'application/json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", globalData.token);
            },
        }).done(function (data) {
            if (data.code === CODE.success) {
                $('#my-uuid').val(data.data.uuid);
                setConnected(true);
                console.log('Connected');
                subscribeChannel();
            } else {
                alert(data.message);
                disconnect();
            }
        });
    });
}*/

/*function subscribeChannel() {
    // Subscribe private chat channel
    stompClient.subscribe(SUBSCRIBE.privateChannel, function (data) {
        data = JSON.parse(data.body);
        if (data.code === CODE.success) {
            const message = data.data;
            showRecord(message)
        } else {
            alert(data.message)
        }
    });

    // Subscribe group chat channel
    stompClient.subscribe(SUBSCRIBE.groupChannel, function (data) {
        data = JSON.parse(data.body);
        if (data.code === CODE.success) {
            const message = data.data;
            showRecord(message)
        } else {
            alert(data.message)
        }
    });

    // Subscribe notify channel
    stompClient.subscribe(SUBSCRIBE.notifyChannel, function (data) {
        data = JSON.parse(data.body);
        if (data.code === CODE.success) {
            const message = data.data;
            showRecord(message)
        } else {
            alert(data.message)
        }
    });
}*/

function disconnect() {
    NABootSocket.disconnect(setConnected(false))
    /*logout();
    if (stompClient !== null) {
        stompClient.disconnect();
    }
    setConnected(false);
    console.log("Disconnected");*/
}

/*function logout() {
    $.ajax({
        type: "POST",
        url: URL.logout,
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", globalData.token);
        },
    }).done(function (data) {
        if (data.code === CODE.success) {
            console.log('Logout successfully.');
        } else {
            alert(data.message);
        }
    });
}*/
function userRegister() {
    let authRegister = new NABootSocket.AuthRegister($('#username').val(),$('#password').val())
    NABootSocket.register(authRegister)
}

function sendPrivateMessage() {
    let message = new NABootSocket.Message($("#my-uuid").val(),$("#target-uuid").val(),$("#private-message").val())
    NABootSocket.sendPrivateMessage(message)
}

function sendGroupMessage() {
    let message = new NABootSocket.Message($("#my-uuid").val(),$("#group-uuid").val(),$("#group-message").val())
    NABootSocket.sendGroupMessage(message)
}
/*function sendPrivateMessage() {
    const message = {
        sender: $("#my-uuid").val(),
        receiver: $("#target-uuid").val(),
        content: $("#private-message").val()
    };
    stompClient.send(SEND.privateChannel, {}, JSON.stringify(message));
}

function sendGroupMessage() {
    const message = {
        sender: $("#my-uuid").val(),
        receiver: $("#group-uuid").val(),
        content: $("#group-message").val()
    };
    stompClient.send(SEND.groupChannel, {}, JSON.stringify(message));
}*/

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });
    $("#connect").click(function () {
        connect();
    });
    $("#disconnect").click(function () {
        disconnect();
    });
    $("#register").click(function () {
        userRegister();
    });
    $("#send-private").click(function () {
        sendPrivateMessage();
    });
    $("#send-group").click(function () {
        sendGroupMessage();
    });
    $("#a-register").attr("href", CENTER_SERVER + "/swagger-ui.html#/access-controller/registerUsingPOST");
    $("#a-group").attr("href", CENTER_SERVER + "/swagger-ui.html#/group-controller/createUsingPOST");
});

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    } else {
        $("#conversation").hide();
    }
    $("#record").html("");
}

function showRecord(message) {
    const record = "<tr>" +
        "<td>" + message.sender + "</td>" +
        "<td>" + message.receiver + "</td>" +
        "<td>" + message.content + "</td>" +
        "<td>" + message.timestamp + "</td>" +
        "</tr>";
    $("#record").append(record);
}
