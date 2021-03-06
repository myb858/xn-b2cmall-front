define([
    'app/controller/base',
    'app/util/ajax',
    'Handlebars'
], function(base, Ajax, Handlebars) {
    var url = APIURL + '/operators/queryCart',
        infos = [],
        $this;
    init();

    function init() {
        if (!base.isLogin()) {
            location.href = "../user/login.html?return=" + base.makeReturnUrl();
        } else {
            if (sessionStorage.getItem("compCode")) {
                getMyCart();
                addListeners();
            } else {
                base.getCompanyByUrl()
                    .then(function(res) {
                        if (sessionStorage.getItem("compCode")) {
                            getMyCart();
                            addListeners();
                        } else {
                            base.showMsg(res.msg);
                            doError();
                        }
                    }, function() {
                        base.showMsg("非常抱歉，暂时无法获取公司信息!");
                        doError();
                    });
            }
        }
    }
    //获取购物车商品
    function getMyCart() {
        infos = [];
        Ajax.get(url, true)
            .then(function(response) {
                if (response.success) {
                    var data = response.data,
                        html = "";
                    if (data.length) {
                        var totalAmount = 0;
                        html = '<ul class="b_bd_b bg_fff">';
                        data.forEach(function(cl) {
                            var amount = (+cl.salePrice) * (+cl.quantity);
                            html += '<li class="ptb8 plr10 clearfix b_bd_b p_r s_14" code="' + cl.code + '" cnyP="' + (cl.salePrice || 0) + '">' +
                                '<div class="wp100 p_r z_index0">' +
                                '<div class="clearfix bg_fff cart-content-left">';
                            //如果已经下架，则无法点击进入购买页，并在页面上提示
                            if (cl.status == "2") {
                                html += '<div class="cart-down t_999">已下架</div>' +
                                    '<div class="fl wp40 tc pl32 p_r c-img-l">' +
                                    '<div class="cart-cont-left"><div class="radio-tip1 ab_l0"><i></i></div></div>' +
                                    '<a href="javascript:void(0)">';
                            } else {
                                html += '<div class="fl wp40 tc pl32 p_r c-img-l">' +
                                    '<div class="cart-cont-left"><div class="radio-tip1 ab_l0"><i></i></div></div>' +
                                    '<a href="../operator/buy.html?code=' + cl.productCode + '">';
                            }
                            html += '<img src="' + cl.advPic + '"/></a></div>' +
                                '<div class="fl wp60 pl12">' +
                                '<p class="t_323232 s_14 line-tow">' + cl.productName + '</p>' +
                                '<p class="t_f64444 s_14 pt4"><span>￥' + (+cl.salePrice / 1000).toFixed(2) + '</span></p>';
                            html += '<div class="t_666 ptb10">' +
                                '<span class="subCount a_s_span t_bold tc"><img src="/static/images/sub-icon.png" style="width: 20px;height: 20px;"/></span>' +
                                '<input type="hidden" value="' + (+cl.quantity) + '"/>' +
                                '<input class="buyCount tc w60p s_13 lh36" type="text" value="' + cl.quantity + '"/>' +
                                '<span class="addCount a_s_span t_bold tc"><img src="/static/images/add-icon.png" style="width: 20px;height: 20px;"/></span>' +
                                '</div></div></div>' +
                                '<div class="al_addr_del">删除</div></div></li>';
                            //保存每种商品当前的总价
                            infos.push(amount);
                        });
                        html += "</ul>";
                        $("#od-ul").html(html);
                        $("#totalCnyAmount").html("0");
                    } else {
                        doError();
                    }
                } else {
                    doError();
                }
            }, function() {
                doError();
            });
    }

    function addListeners() {
        //购买
        $("#sbtn").on("click", function() {
            var checkItem = [];
            var allItems = $("#od-ul>ul>li div.c-img-l div.radio-tip1");
            for (var i = 0; i < allItems.length; i++) {
                var item = allItems[i];
                if ($(item).hasClass("active")) {
                    if (!$(item).closest("li[code]").find("div.cart-down").length) {
                        checkItem.push(i);
                        //如果包含下架商品
                    } else {
                        base.showMsg("您所选择的商品中包含已经下架的商品，<br/>请重新选择！", 2000);
                        return;
                    }
                }
            }
            if (checkItem.length) {
                location.href = '../operator/submit_order.html?code=' + checkItem.join("_") + '&type=2';
            } else {
                base.showMsg("未选择购买的商品");
            }
        });
        //减少商品数量按钮
        $("#od-ul").on("click", ".subCount", function(e) {
            e.stopPropagation();
            var $input = $(this).next().next();
            var orig = $input.val();
            if (orig == undefined || orig.trim() == "" || orig == "0" || orig == "1") {
                orig = 2;
            }
            orig = +orig - 1;
            $input.val(orig);
            $input.change();
        });
        //增加商品数量按钮
        $("#od-ul").on("click", ".addCount", function(e) {
            e.stopPropagation();
            var $input = $(this).prev();
            var orig = $input.val();
            if (orig == undefined || orig.trim() == "") {
                orig = 0;
            }
            orig = +orig + 1;
            $input.val(orig);
            $input.change();
        });
        /********监测数量输入框的变化start*******/
        $("#od-ul").on("keyup", "input", function(e) {
            e.stopPropagation();
            var keyCode = e.charCode || e.keyCode;
            var me = $(this);
            if (!isSpecialCode(keyCode) && !isNumber(keyCode)) {
                me.val(me.val().replace(/[^\d]/g, ""));
            }
            // if (!me.val()) {
            //     me.change();
            // }
        }).on("change", "input[type=text]", function(e) {
            e.stopPropagation();
            var keyCode = e.charCode || e.keyCode;
            var me = $(this);
            if (!isSpecialCode(keyCode)) {
                me.val(me.val().replace(/[^\d]/g, ""));
            }
            if (!me.val()) {
                me.val("1");
            }
            if (me.val() == "0") {
                me.val("1");
            }
            var gp = $(this).parents("li[code]"),
                cnyPrice = +gp.attr("cnyP");
            var config = {
                "code": gp.attr("code"),
                "quantity": this.value
            };
            //修改购物车商品信息
            $("#loaddingIcon").removeClass("hidden");
            me = this;
            Ajax.post(APIURL + '/operators/editCart', config)
                .then(function(response) {
                    $("#loaddingIcon").addClass("hidden");
                    if (response.success) {
                        var flag = gp.find(".c-img-l .radio-tip1.active").length,
                            $prev = $(me).prev(),
                            count = me.value,
                            cnyUnit = cnyPrice,
                            //当前商品最新人民币总价
                            new_cnyAmount = cnyUnit * (+count),
                            info = infos[gp.index()],
                            //当前商品老的人民币总价
                            ori_cnyAmount = info,
                            //已经勾选的商品老的人民币总价
                            ori_cnyTotal = +$("#totalCnyAmount").text() * 1000,
                            //已经勾选的商品最新的人民币总价
                            new_cnyTotal = new_cnyAmount - ori_cnyAmount + ori_cnyTotal;
                        //更新当前商品的总价
                        infos[gp.index()] = new_cnyAmount;
                        //保存当前商品最新的数量
                        $prev.val(count);
                        //如果当前商品处于被勾选的状态，则更新页面底部的总价
                        if (flag) {
                            $("#totalCnyAmount").text((new_cnyTotal / 1000).toFixed(2));
                        }
                    } else {
                        me.value = $(me).prev().val();
                        base.showMsg("数量修改失败，请稍后重试！");
                    }
                }, function() {
                    $("#loaddingIcon").addClass("hidden");
                    me.value = $(me).prev().val();
                    base.showMsg("数量修改失败，请稍后重试！");
                });
        });
        /********监测数量输入框的变化end*******/
        //全选按钮
        $("#allChecked").on("click", function() {
            var flag = false,
                me = $(this),
                doAction = "removeClass";
            if (me.hasClass("active")) {
                me.removeClass("active");
            } else {
                me.addClass("active");
                flag = true;
                doAction = "addClass";
            }
            //点击全选后，每种商品前面的勾选框也相应变化
            $("#od-ul>ul>li div.c-img-l div.radio-tip1")
                .each(function(i, item) {
                    $(item)[doAction]("active");
                });
            //如果目前处于全选状态，则更新页面底部的总价
            if (flag) {
                var t = 0;
                for (var i = 0; i < infos.length; i++) {
                    t += infos[i];
                }
                $("#totalCnyAmount").text((t / 1000).toFixed(2));
                //否则把页面底部总价置为0
            } else {
                $("#totalCnyAmount").text("0");
            }
        });
        //勾选商品
        $("#od-ul").on("click", "li[code] .cart-cont-left", function(e) {
            e.stopPropagation();
            var $li = $(this).closest("li[code]"),
                isChecked = false,
                me = $(this).find(".radio-tip1");
            if (me.hasClass("active")) {
                me.removeClass("active");
            } else {
                me.addClass("active");
                isChecked = true;
            }

            if (isChecked) {
                if ($("#od-ul>ul>li").length == $("#od-ul>ul>li .c-img-l div.active").length) {
                    $("#allChecked").addClass("active");
                }
                var ori_cnyTotal = (+$("#totalCnyAmount").text()) * 1000;
                $("#totalCnyAmount").text(((ori_cnyTotal + infos[$li.index()]) / 1000).toFixed(2));
            } else {
                var items = $("#od-ul").children("li").find("input[type=checkbox]"),
                    flag = false;
                $("#allChecked").removeClass("active");
                var ori_cnyTotal = (+$("#totalCnyAmount").text()) * 1000;
                $("#totalCnyAmount").text(((ori_cnyTotal - infos[$li.index()]) / 1000).toFixed(0));
            }
        });
        //确认删除框点击确认按钮
        $("#odOk").on("click", function() {
            deleteFromCart($this);
            $("#od-mask, #od-tipbox").addClass("hidden");
        });
        //确认删除框点击取消按钮
        $("#odCel").on("click", function() {
            $("#od-mask, #od-tipbox").addClass("hidden");
        });
        /**********左滑显示删除按钮事件start**********/
        $("#od-ul").on("touchstart", ".cart-content-left", function(e) {
            e.stopPropagation();
            var touches = e.originalEvent.targetTouches[0],
                me = $(this);
            var left = me.offset().left;
            me.data("x", touches.clientX);
            me.data("offsetLeft", left);
        });
        $("#od-ul").on("touchmove", ".cart-content-left", function(e) {
            e.stopPropagation();
            var touches = e.originalEvent.changedTouches[0],
                me = $(this),
                ex = touches.clientX,
                xx = parseInt(me.data("x")) - ex,
                left = me.data("offsetLeft");
            if (xx > 10) {
                me.css({
                    "transition": "none",
                    "transform": "translate3d(" + (-xx / 2) + "px, 0px, 0px)"
                });
            } else if (xx < -10) {
                var left = me.data("offsetLeft");
                me.css({
                    "transition": "none",
                    "transform": "translate3d(" + (left + (-xx / 2)) + "px, 0px, 0px)"
                });
            }
        });
        $("#od-ul").on("touchend", ".cart-content-left", function(e) {
            e.stopPropagation();
            var me = $(this);
            var touches = e.originalEvent.changedTouches[0],
                ex = touches.clientX,
                xx = parseInt(me.data("x")) - ex;
            if (xx > 56) {
                me.css({
                    "transition": "-webkit-transform 0.2s ease-in",
                    "transform": "translate3d(-56px, 0px, 0px)"
                });
            } else {
                me.css({
                    "transition": "-webkit-transform 0.2s ease-in",
                    "transform": "translate3d(0px, 0px, 0px)"
                });
            }
        });
        /**********左滑显示删除按钮事件end**********/
        //左滑后删除商品
        $("#od-ul").on("click", ".al_addr_del", function(e) {
            e.stopPropagation();
            $this = this;
            $("#od-mask, #od-tipbox").removeClass("hidden");
        });
    }

    function isNumber(code) {
        if (code >= 48 && code <= 57 || code >= 96 && code <= 105) {
            return true;
        }
        return false;
    }

    function deleteFromCart(me) {
        var $li = $(me).closest("li[code]"),
            code = $li.attr('code');
        $("#loaddingIcon").removeClass("hidden");
        Ajax.post(APIURL + "/operators/deleteFromCart", { "code": code })
            .then(function(response) {
                $("#loaddingIcon").addClass("hidden");
                if (response.success) {
                    var ccl = $(me).prev().find(".cart-cont-left"),
                        activeRadio = ccl.find(".radio-tip1.active");
                    if (activeRadio.length) {
                        activeRadio.click();
                    }
                    infos.splice($li.index(), 1);
                    $li.remove();
                    if (!$("#od-ul>ul>li").length) {
                        $("#cart-bottom").hide();
                        $("#od-ul").html('<div class="bg_fff" style="text-align: center;line-height: 150px;">购物车内暂无商品</div>');
                    }
                } else {
                    base.showMsg("删除失败，请稍后重试！");
                }
            }, function() {
                $("#loaddingIcon").addClass("hidden");
                base.showMsg("删除失败，请稍后重试！");
            });
    }

    function isSpecialCode(code) {
        if (code == 37 || code == 39 || code == 8 || code == 46) {
            return true;
        }
        return false;
    }

    function doError() {
        $("#cart-bottom").hide();
        $("#cont").addClass("hidden");
        $("#noItem").removeClass("hidden");
    }
});