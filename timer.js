/*!
 * =====================================================
 *  用法：
 * 	var x=new Timer({
		id:"abc",
		server:0, 0是本地；1是服务器时间；2是北京时间;
		endtime:"06/27 /2016 15:25:30",
		show:function(id,d,h,m,s,ms){
			id.innerHTML=d+"/"+h+"/"+m+"/"+s+"/"+ms;
		},
		over:function(id,d,h,m,s,ms){
			id.innerHTML="已经过期";
		}
	});
 * =====================================================
 * 闫亮 2016-09-28 by 1.7 
 *----------------------------------------------------------
 * by 1.7 
 * 主要修复
 * 1.多个定时器调用时，当前状态下：其中某个定时器过期后会触发没过期的某个定时器停止倒计时!
 * 2.多个定时器调用时，当前状态下：每次到0秒会有一秒钟的过期负数时间显示错误！
 * 3.增加当前调用id的对象输出,方便配合其他功能模块全局调用,例：结合上边var x用法 可在全局状态下输出x.config.id 即可得到id为abc的字符串！
 *
 * by 1.8
 * 修复倒计时到期以后还在不停请求的bug
 *
 * by 1.9
 * 增强over功能
 *
 */
(function(win) {
    var timer = function() {
        this.Init.apply(this, arguments);
        this.settime;
        this.Render();
    }

    timer.prototype = {
        Init: function() { //初始化
            var args = Array.prototype.slice.call(arguments, 0);
            if (args && args.length > 0) {
                var config = args[0];
                var getType = Object.prototype.toString;
                if (config && getType.call(config) == "[object Object]") {
                    //this.config = config;
                    this.config = config || {
                        id: '', //控件id
                        server: 0, //0客户端，1服务器时间，2北京时间
                        endtime: '', //倒计时结束时间
                        show: function(id, d, h, m, s, ms) {}, //倒计时显示函数
                        over: function(id, d, h, m, s, ms) {} //倒计时过期以后显示
                    };
                }
            }
            //IE8.0以下兼容bind
            if (!Function.prototype.bind) {
                Function.prototype.bind = function(oThis) {
                    if (typeof this !== "function") {
                        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                    }
                    var aArgs = Array.prototype.slice.call(arguments, 1),
                        fToBind = this,
                        fNOP = function() {},
                        fBound = function() {
                            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                        };
                    fNOP.prototype = this.prototype;
                    fBound.prototype = new fNOP();
                    return fBound;
                };
            }
        },
        Render: function() { //功能区
            var self = this,
                CurrentTime = null,
                sc = self.config,
                sc_i = sc.id,
                sc_s = self.config.server;
            if (sc) {
                var autoElement = document.getElementById(sc_i),
                    endtime = new Date(sc.endtime).getTime(); //结束时间毫秒
                self.autoElement = autoElement;
                if (sc_s.toString()) {
                    var url_array = ["http://www.zhongye.net/api/apiservice.aspx?method=Web.GetCurrTime&format=json", "http://www.zhongye.net/api/apiservice.aspx?method=Web.GetCurrTimeObj&format=json"],
                        get_url = null;
                    switch (sc_s) {
                        case 1:
                            get_url = url_array[0];
                            break;
                        case 2:
                            get_url = url_array[1];
                            break;
                    }
                    if (sc_s === 1 || sc_s === 2) {
                        self.util.get_js(get_url, function(data) {
                            if (sc_s === 1) {
                                //服务器时间
                                var ts = data;
                                CurrentTime = ts.time;
                            } else if (sc_s === 2) {
                                //北京时间
                                var dto = data.toString().replace(/\r\n/g, " "),
                                    dto_data = ["nyear=", "nmonth=", "nday=", "nhrs=", "nmin=", "nsec="],
                                    dto_time = dto.replace(/t0=new\sDate\(\)\.getTime\(\);\snyear=(\d*);\snmonth\=(\d*);\snday=(\d*);\snwday=(\d*);\snhrs=(\d*);\snmin=(\d*);\snsec=(\d*);/ig, '$1/$2/$3 $5:$6:$7');
                                CurrentTime = dto_time;
                            }
                            //倒计时
                            var nowtime = new Date(CurrentTime).getTime(), //服务器当前时间 毫秒数
                                diff = (new Date().getTime() - nowtime); //客户端和服务器端的时间差
                            self.util.show_time(endtime, diff, autoElement, sc_s, self.test.bind(self), nowtime);

                        });
                    } else if (sc_s === 0) {
                        //本地时间
                        var diff = null;
                        self.util.show_time(endtime, diff, autoElement, sc_s, self.test.bind(self));
                    }
                }
            }
        },
        test: function(d, h, m, s, ms, nowtime) {
            s < 0 || s == 0 && m < 0 ? this.config.over(this.autoElement, d, h, m, s, ms, nowtime) : (d = d <= 9 ? "0" + d : d, h = h <= 9 ? "0" + h : h, m = m <= 9 ? "0" + m : m, s = s <= 9 ? "0" + s : s, this.config.show(this.autoElement, d, h, m, s, ms, nowtime));
        },
        //扩展功能
        util: {
            //倒计时
            show_time: function(endtime, diff, id, sc_s, fn, nowtime) {

                var y,
                    d,
                    h,
                    m,
                    s,
                    ms,
                    data,
                    x,
                    flag,
                    self = this,
                    nows = new Date().getTime(), //客户端当前时间毫秒数
                    lefttime = sc_s === 0 ? parseInt((endtime - nows) / 1000) : parseInt((endtime - nows + diff) / 1000);
                d = parseInt(lefttime / 3600 / 24);
                h = parseInt((lefttime / 3600) % 24);
                m = parseInt((lefttime / 60) % 60);
                s = parseInt(lefttime % 60);
                ms = new Date().getMilliseconds();
                //ms = new String(nows).substring(new String(nows).length - 3);			
                fn.call(self, d, h, m, s, ms, self.formatDate(nowtime));
                //bug 多个倒计时调用时，会停止所有的倒计时运行 s<0||s==0&&m<0?clearTimeout(self.settime):self.settime=setTimeout(arguments.callee.bind(self, endtime, diff, id, sc_s, fn), 50);
                //已修复
                s < 0 || s == 0 && m < 0 ? flag = true : flag = false;
                self.settime = setTimeout(arguments.callee.bind(self, endtime, diff, id, sc_s, fn, self.formatDate(nowtime)), 50);
                if (flag == true) { clearTimeout(self.settime) };

            },
            formatDate: function(now) {
                var year = new Date(now).getFullYear();
                var month = new Date(now).getMonth() + 1;
                var date = new Date(now).getDate();
                var hour = new Date(now).getHours();
                var minute = new Date(now).getMinutes();
                var second = new Date(now).getSeconds();
                return year + "/" + month + "/" + date + " " + hour + ":" + minute + ":" + second;
            },
            //跨域请求时间
            get_js: function(get_url, fn) {
                var script = null,
                    xhead = document.getElementsByTagName("head")[0];
                script = document.createElement("script");
                script.type = "text/javascript";
                script.src = get_url;
                var browser = navigator.appName,
                    b_version = navigator.appVersion,
                    version = b_version.split(";"),
                    trim_Version = version[1] ? version[1].replace(/[ ]/g, "") : null;

                if (browser == "Microsoft Internet Explorer" && trim_Version == "MSIE6.0" || browser == "Microsoft Internet Explorer" && trim_Version == "MSIE7.0" || browser == "Microsoft Internet Explorer" && trim_Version == "MSIE8.0" || browser == "Microsoft Internet Explorer" && trim_Version == "MSIE9.0") {
                    if (typeof fn === "function") {
                        script.onreadystatechange = function() {
                            var r = script.readyState;
                            if (r === 'loaded' || r === 'complete') {
                                fn.call(callback_x, callback_x);
                                script.onreadystatechange = null;
                            }
                        };
                    }
                    xhead.insertBefore(script);
                    //head.appendChild(script);
                    //document.write(script.outerHTML);
                } else {
                    xhead.insertBefore(script, xhead.firstChild);
                    script.onload = script.onreadystatechange = function() {
                        if (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') {
                            fn.call(callback_x, callback_x);
                        }
                        script.onload = script.onreadystatechange = null;
                    }
                }


            }
        }
    }


    win.Timer = function(obj) {
        //new timer(obj).Render();
        return new timer(obj);
    }

})(window);