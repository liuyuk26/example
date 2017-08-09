(function () {
    function tdClass(i, disabledDay, sameMonth, values, dateStr) {
        var cls = i == 0 || i == 6 ? 'weekend' : '';
        if (disabledDay && disabledDay.indexOf(i) != -1) cls += (cls ? ' ' : '') + 'disabled';
        if (!sameMonth) cls += (cls ? ' ' : '') + 'empty';
        if (sameMonth && values && cls.indexOf('disabled') == -1 && values.indexOf(',' + dateStr + ',') != -1) cls += (cls ? ' ' : '') + 'selected';
        return cls == '' ? '' : ' class="' + cls + '"';
    }

    function renderMonth(year, month, clear, disabledDay, values) {
        var d = new Date(year, month - 1, 1),
            s = '<table cellpadding="3" cellspacing="1" border="0"' + (clear ? ' class="right"' : '') + '>'
                + '<tr><th colspan="7" class="head">' + year + '年' + month + '月</th></tr>'
                + '<tr><th class="weekend">日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th class="weekend">六</th></tr>';
        var dMonth = month - 1;
        var firstDay = d.getDay(), hit = false;
        s += '<tr>';
        for (var i = 0; i < 7; i++)
            if (firstDay == i || hit) {
                s += '<td' + tdClass(i, disabledDay, true, values, year + '-' + month + '-' + d.getDate()) + '>' + d.getDate() + '</td>';
                d.setDate(d.getDate() + 1);
                hit = true;
            } else s += '<td' + tdClass(i, disabledDay, false) + '>&nbsp;</td>';
        s += '</tr>';
        for (var i = 0; i < 5; i++) {
            s += '<tr>';
            for (var j = 0; j < 7; j++) {
                s += '<td' + tdClass(j, disabledDay, d.getMonth() == dMonth, values, year + '-' + month + '-' + d.getDate()) + '>' + (d.getMonth() == dMonth ? d.getDate() : '&nbsp;') + '</td>';
                d.setDate(d.getDate() + 1);
            }
            s += '</tr>';
        }
        return s + '</table>' + (clear ? '<br>' : '');
    }

    function getDateStr(td) {
        return td.parentNode.parentNode.rows[0].cells[0].innerHTML.replace(/[年月]/g, '-') + td.innerHTML
    }

    function renderYear(year, el, disabledDay, value) {
        el.find('td').unbind();
        var s = '', values = ',' + value.join(',') + ',';
        for (var i = 1; i <= 12; i++) s += renderMonth(year, i, i % 4 == 0, disabledDay, values);
        el.find('div.picker').html(s).find('td').click(function () {
            if (!/disabled|empty/g.test(this.className)) $(this).toggleClass('selected');
            if (this.className.indexOf('empty') == -1 && typeof el.data('config').cellClick == 'function')
                el.data('config').cellClick(getDateStr(this), this.className.indexOf('disabled') != -1);
        });
    }

    //@config：配置，具体配置项目看下面
    //@param：为方法时需要传递的参数
    $.fn.fullYearPicker = function (config, param) {
        if (config === 'setDisabledDay' || config === 'setYear' || config === 'getSelected' || config === 'acceptChange' || config === 'setColors') {//方法
            var me = $(this);
            if (config == 'setYear') {//重置年份
                me.data('config').year = param;//更新缓存数据年份
                me.find('div.year a:first').trigger('click', true);
            }
            else if (config == 'getSelected') {//获取当前当前年份选中的日期集合（注意不更新默认传入的值，要更新值请调用acceptChange方法）
                return me.find('td.selected').map(function () {
                    return getDateStr(this);
                }).get();
            }
            else if (config == 'acceptChange') {//更新日历值，这样才会保存选中的值，更换其他年份后，再切换到当前年份才会自动选中上一次选中的值
                me.data('config').value = me.fullYearPicker('getSelected');
            }
            else if (config == 'setColors') {//设置单元格颜色 param格式为{defaultColor:'#f00',dc:[{d:'2017-8-2',c:'blue'}..]}，dc数组c缺省会用defaultColor代替，defaultColor也缺省默认红色
                return me.find('td').each(function () {
                    var d = getDateStr(this);
                    for (var i = 0; i < param.dc.length; i++) if (d == param.dc[i].d) this.style.backgroundColor = param.dc[i].c || param.defaultColor || '#f00';
                });
            }
            else {
                me.find('td.disabled').removeClass('disabled');
                me.data('config').disabledDay = param;//更新不可点击星期
                if (param) {
                    me.find('table tr:gt(1)').find('td').each(function () {
                        if (param.indexOf(this.cellIndex) != -1)
                            this.className = (this.className || '').replace('selected', '') + (this.className ? ' ' : '') + 'disabled';
                    });
                }
            }
            return this;
        }
        //@year:显示的年份
        //@disabledDay:不允许选择的星期列，注意星期日是0，其他一样
        //@cellClick:单元格点击事件（可缺省）。事件有2个参数，第一个@dateStr：日期字符串，格式“年-月-日”，第二个@isDisabled，此单元格是否允许点击
        //@value:选中的值，注意为数组字符串，格式如['2016-6-25','2016-8-26'.......]
        //@yearScale:配置这个年份变为下拉框，格式如{min:2000,max:2020}
        config = $.extend({year: new Date().getFullYear(), disabledDay: '', value: []}, config);
        return this.addClass('fullYearPicker').each(function () {
            var me = $(this), year = config.year || new Date().getFullYear(),
                newConifg = {
                    cellClick: config.cellClick,
                    disabledDay: config.disabledDay,
                    year: year,
                    value: config.value,
                    yearScale: config.yearScale
                };
            me.data('config', newConifg);
            console.log(newConifg)
            var selYear = '';
            if (newConifg.yearScale) {
                selYear = '<select>';
                for (var i = newConifg.yearScale.min,
                         j = newConifg.yearScale.max; i < j; i++) selYear += '<option value="' + i + '"' + (i == year ? ' selected' : '') + '>' + i + '</option>';

                selYear += '</select>';
            }
            selYear = selYear || year;
            me.append('<div class="year"><a href="#">上一年</a>' + selYear + '年<a href="#" class="next">下一年</a></div><div class="picker"></div>')
                .find('a').click(function (e, setYear) {
                if (setYear) year = me.data('config').year;
                else this.innerHTML == '上一年' ? year-- : year++;
                me.find('select').val(year);
                renderYear(year, $(this).closest('div.fullYearPicker'), newConifg.disabledDay, newConifg.value);
                this.parentNode.firstChild.nextSibling.data = year + '年';
                return false;
            }).end().find('select').change(function () {
                me.fullYearPicker('setYear', this.value);
            });
            renderYear(year, me, newConifg.disabledDay, newConifg.value);
        });
    };
})();
//示例
$('#div1').fullYearPicker({
    disabledDay: '0',
    value: ['2016-6-25', '2016-8-26'],
    yearScale: {min: 2000, max: 2020},
    cellClick: function (dateStr, isDisabled) {
        console.log(arguments)
    }
});
$('input').click(function () {
    switch (this.value) {
        case '获取日历当前选中值':
            alert($('#div1').fullYearPicker('getSelected'));
            break;
        case '更新日历值':
            $('#div1').fullYearPicker('acceptChange');
            alert('更新值成功，切换年份查看效果');
            break;
        case '设置为指定年份':
            var year = prompt('请输入4位年份数字');
            if (/^\d{4}$/.test(year)) $('#div1').fullYearPicker('setYear', parseInt(year)); else alert('年份为4位数字！');
            break;
        case '设置为指定星期不可选':
            var day = prompt('请输入0~6的数字，不输入则设置所有星期可选');
            if (/^[0-6]*$/.test(day)) $('#div1').fullYearPicker('setDisabledDay', day); else alert('请输入0~6的数字！');
            break;
        case '设置制定日期单元格背景色':
            $('#div1').fullYearPicker('setColors', {
                dc: [{d: '2017-9-1'}, {d: '2017-6-1', c: 'blue'}, {
                    d: '2017-5-1',
                    c: 'yellow'
                }, {d: '2017-8-1', c: 'green'}]
            });
    }
});