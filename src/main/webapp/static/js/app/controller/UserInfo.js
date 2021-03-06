define([
    'app/controller/base',
    'app/util/ajax'
], function(base, Ajax) {
    init();

    function init() {
        if (!base.isLogin()) {
            location.href = "./login.html?return=" + base.makeReturnUrl();
        } else {
            if (sessionStorage.getItem("compCode")) {
                getUserInfo();
                getTimeAndMobile();
            } else {
                base.getCompanyByUrl()
                    .then(function(res) {
                        if (sessionStorage.getItem("compCode")) {
                            getUserInfo();
                            getTimeAndMobile();
                        } else {
                            base.showMsg(res.msg);
                            $("#loadI").hide();
                        }
                    }, function() {
                        base.showMsg("非常抱歉，暂时无法获取公司信息!");
                        $("#loadI").hide();
                    });
            }
        }
    }

    function getUserInfo() {
        Ajax.get(APIURL + '/user', {})
            .then(function(response) {
                $("#loadI").hide();
                if (response.success) {
                    var data = response.data;
                    if (base.isWxLogin()) {
                        $("#mobile").text(data.nickname);
                        data.userExt.photo && $("#photo").attr("src", data.userExt.photo);
                        if (data.mobile) {
                            localStorage.setItem("m", data.mobile);
                        } else {
                            localStorage.removeItem("m");
                        }
                    } else {
                        $("#mobile").text(data.mobile);
                    }
                } else {
                    base.showMsg("暂时无法获取用户信息！");
                }
            }, function() {
                $("#loadI").hide();
                base.showMsg("暂时无法获取用户信息！");
            });
    }

    function getTimeAndMobile() {
        $("#fwMobile").text(sessionStorage.getItem("sMobile"));
        $("#fwTime").text(sessionStorage.getItem("sTime"));
    }
});