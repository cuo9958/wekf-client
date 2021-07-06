"use strict";
!(function (win, undefined) {
    var defs = {
        url: "/", //服务地址
        path: "/_img", //地址后缀
        user: null,
        project: "", //项目名称
        full: false,
        title: "微客服", //客服顶部标题
    };
    function getConfigs(data) {
        var conf = Object.assign({}, defs, data);
        if (!conf.user) {
            conf.user = {
                uname: "游客",
            };
            //随机用户
            let tmp = localStorage.getItem("_wekf_uid");
            let tmp2 = localStorage.getItem("_wekf_uname");
            if (tmp2) conf.user.uname = tmp2;
            if (tmp) {
                conf.user.uid = tmp;
            } else {
                conf.user.uid = "1" + Date.now() + Math.round(Math.random() * 9999);
                localStorage.setItem("_wekf_uid", conf.user.uid);
            }
        }
        return conf;
    }
    //创建dom节点
    function createElement(data, dom) {
        var obj = document.createElement(dom || "div");
        if (data.id) {
            obj.id = data.id;
        }
        if (data.className) {
            obj.className = data.className;
        }
        return obj;
    }
    function createMessage(msg) {
        return {
            id: 123,
            type: "text",
            data: msg,
        };
    }
    class WeKF {
        constructor(opts) {
            //初始化内容
            var conf = getConfigs(opts);
            console.log("参数", conf);
            //客户端实例
            this.client = null;
            this.msg_content = null;
            this.msg_box = null;
            this.conf = conf;

            if (!conf.full) {
                //生成按钮
                var box = document.createElement("div");
                box.id = "wekf-box";
                document.body.appendChild(box);
                box.innerHTML =
                    '<svg fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 64 64"><path fill="#f3f5f7" d="M12.7 53.4l.6-.6A28 28 0 1132 60H12.8a3 3 0 01-2-1 3 3 0 01.3-4.4l1.6-1.2z"></path></svg>';
                box.onclick = this.open.bind(this);
            } else {
                //打开窗口
                this.open();
            }
        }
        open() {
            var that = this;
            //关闭小窗口
            var box = document.getElementById("wekf-box");
            if (box) box.style.display = "none";
            //创建聊天窗口
            var chat = createElement({ id: "wekf-chat" });
            document.body.appendChild(chat);
            //头部
            var chat_head = createElement({ className: "wekf-chat-head" });
            chat_head.innerHTML = `<span>${this.conf.title}</span><a href="javascript:void();">x</a>`;
            //聊天
            var chat_body = createElement({ className: "wekf-chat-body" });
            this.msg_box = chat_body;
            //消息发送
            var chat_foot = createElement({ className: "wekf-chat-foot" });

            var chat_foot_msg = createElement({ className: "wekf-chat-foot-msg" });
            chat_foot.appendChild(chat_foot_msg);

            var chat_foot_msg_t = createElement({ className: "wekf-chat-foot-msg-t" }, "textarea");
            chat_foot_msg.appendChild(chat_foot_msg_t);
            this.msg_content = chat_foot_msg_t;

            var chat_foot_btn = createElement({ className: "wekf-chat-foot-btn" });
            chat_foot.appendChild(chat_foot_btn);

            var send_btn = createElement({ className: "wekf-chat-foot-send" }, "button");
            send_btn.innerHTML = "发送";
            chat_foot_btn.appendChild(send_btn);
            send_btn.onclick = function () {
                that.sendMsg.apply(that);
            };
            //最后
            chat.appendChild(chat_head);
            chat.appendChild(chat_body);
            chat.appendChild(chat_foot);
            this.linsten();
        }
        sendMsg() {
            if (!this.msg_content) return;
            var val = this.msg_content.value;
            //插入当前消息
            this.insertMsg(val);
        }
        insertMsg(msg) {
            if (!msg) return;
            console.log("插入消息", msg);
            var data = createMessage(msg);
            var msg_item = createElement({ className: "msg-item" });
            msg_item.setAttribute("msg_id", data.id);
            msg_item.setAttribute("msg_type", data.type);
            const msg_item_content = createElement({ className: "msg-item-content" });
            msg_item_content.innerHTML = data.data;
            msg_item.appendChild(msg_item_content);

            this.talk(data);
            this.msg_box.appendChild(msg_item);
            this.scrollBottom();

            this.msg_content.value = "";
        }
        scrollBottom() {
            this.msg_box.scrollTop = this.msg_box.scrollHeight;
        }
        receiveMsg(data) {
            var msg_item = createElement({ className: "msg-item2" });
            msg_item.setAttribute("msg_id", data.id);
            msg_item.setAttribute("msg_type", data.type);
            const msg_item_content = createElement({ className: "msg-item-content" });
            msg_item_content.innerHTML = data.data;
            msg_item.appendChild(msg_item_content);
            this.msg_box.appendChild(msg_item);
            this.scrollBottom();
        }

        linsten() {
            const client = io(this.conf.url, {
                path: this.conf.path,
                query: Object.assign({ project: this.conf.project }, this.conf.user),
            });
            client.on("connect", function () {
                console.log("连接成功");
            });
            client.on("join", this.joined.bind(this));
            client.on("talk", this.reback.bind(this));
            this.client = client;
        }
        joined(name) {
            console.log("join", name);
            var msg_item = createElement({ className: "msg-tip" });
            msg_item.innerHTML = name + "加入聊天";
            this.msg_box.appendChild(msg_item);
        }
        reback(data) {
            console.log("talk", data);
            this.receiveMsg(data);
        }
        on(key, fn) {
            if (!this.client) return;
            this.client.on(key, fn);
        }
        emit(key, fn) {
            if (!this.client) return;
            this.client.emit(key, fn);
        }
        //说话
        talk(data) {
            if (!this.client) return;
            this.client.emit("talk", data);
        }
    }

    win.WeKF = win.WeKF || WeKF;
})(window, undefined);
