//需要的样式
document.write('<style>.cannotselect{-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select:none;user-select:none;}td.selected{background:#0094ff;color:#fff}td.hide{display:none}</style>');
//jQuery表格单元格合并插件，功能和excel单元格合并功能一样，并且可以保留合并后的所有单元格内容到第一个单元格中
$.fn.tableMergeCells = function () {
    return this.each(function () {
        var tb = $(this), startTD, endTD,
            MMRC = {startRowIndex: -1, endRowIndex: -1, startCellIndex: -1, endCellIndex: -1};
        //如果表格存在合并的，先补全td在初始化rc
        var tds = tb.find('td[colspan],td[rowspan]'), v, vc;
        if (tds.length) {
            tds.filter('[colspan]').each(function () {
                v = (parseInt($(this).attr('colspan')) || 1) - 1;
                if (v > 0) for (var i = 0; i < v; i++) $(this).after('<td class="hide"></td>');
            }).end().filter('[rowspan]').each(function () {
                v = parseInt($(this).attr('rowspan')) || 1;
                vc = parseInt($(this).attr('colspan')) || 1;
                if (v > 1) {
                    for (var i = 1; i < v; i++) {
                        var td = $(this.parentNode.parentNode.rows[this.parentNode.rowIndex + i].cells[this.cellIndex]);
                        for (var j = 0; j < vc; j++) td.before('<td class="hide"></td>')
                    }
                }
            });
        }
        //初始化所有单元格的行列下标内容并存储到dom对象中
        tb.find('tr').each(function (r, tr) {
            $('td', this).each(function (c, td) {
                $(this).data('rc', {
                    r: r, c: c,
                    maxc: c + (parseInt(this.getAttribute('colspan')) || 1) - 1,
                    maxr: r + (parseInt(this.getAttribute('rowspan')) || 1) - 1
                });
            })
        });
        if (tds.length) tb.find('td.hide').remove();//删除补全的td
        //添加表格禁止选择样式和事件
        tb.addClass('cannotselect').bind('selectstart', function () {
            return false
        });
        //选中单元格处理函数
        function addSelectedClass() {
            var selected = false, rc, t;
            tb.find('td').each(function () {
                rc = $(this).data('rc');
                //判断单元格左上坐标是否在鼠标按下和移动到的单元格行列区间内
                selected = rc.r >= MMRC.startRowIndex && rc.r <= MMRC.endRowIndex && rc.c >= MMRC.startCellIndex && rc.c <= MMRC.endCellIndex;
                if (!selected && rc.maxc) {//合并过的单元格，判断另外3（左下，右上，右下）个角的行列是否在区域内
                    selected =
                        (rc.maxr >= MMRC.startRowIndex && rc.maxr <= MMRC.endRowIndex && rc.c >= MMRC.startCellIndex && rc.c <= MMRC.endCellIndex) ||//左下
                        (rc.r >= MMRC.startRowIndex && rc.r <= MMRC.endRowIndex && rc.maxc >= MMRC.startCellIndex && rc.maxc <= MMRC.endCellIndex) ||//右上
                        (rc.maxr >= MMRC.startRowIndex && rc.maxr <= MMRC.endRowIndex && rc.maxc >= MMRC.startCellIndex && rc.maxc <= MMRC.endCellIndex);//右下

                }
                if (selected) this.className = 'selected';
            });
            var rangeChange = false;
            tb.find('td.selected').each(function () { //从已选中单元格中更新行列的开始结束下标
                rc = $(this).data('rc');
                t = MMRC.startRowIndex;
                MMRC.startRowIndex = Math.min(MMRC.startRowIndex, rc.r);
                rangeChange = rangeChange || MMRC.startRowIndex != t;

                t = MMRC.endRowIndex;
                MMRC.endRowIndex = Math.max(MMRC.endRowIndex, rc.maxr || rc.r);
                rangeChange = rangeChange || MMRC.endRowIndex != t;

                t = MMRC.startCellIndex;
                MMRC.startCellIndex = Math.min(MMRC.startCellIndex, rc.c);
                rangeChange = rangeChange || MMRC.startCellIndex != t;

                t = MMRC.endCellIndex;
                MMRC.endCellIndex = Math.max(MMRC.endCellIndex, rc.maxc || rc.c);
                rangeChange = rangeChange || MMRC.endCellIndex != t;
            });
            //注意这里如果用代码选中过合并的单元格需要重新执行选中操作
            if (rangeChange) addSelectedClass();
        }

        function onMousemove(e) {//鼠标在表格单元格内移动事件
            e = e || window.event;
            var o = e.srcElement || e.target;
            if (o.tagName == 'TD') {
                endTD = o;
                var sRC = $(startTD).data('rc'), eRC = $(endTD).data('rc'), rc;
                MMRC.startRowIndex = Math.min(sRC.r, eRC.r);
                MMRC.startCellIndex = Math.min(sRC.c, eRC.c);
                MMRC.endRowIndex = Math.max(sRC.r, eRC.r);
                MMRC.endCellIndex = Math.max(sRC.c, eRC.c);
                tb.find('td').removeClass('selected');
                addSelectedClass();
            }
        }

        function onMouseup(e) {//鼠标弹起事件
            tb.unbind({mouseup: onMouseup, mousemove: onMousemove});
            if (startTD && endTD && startTD != endTD && confirm('确认合并？！')) {//开始结束td不相同确认合并
                var tds = tb.find('td.selected'), firstTD = tds.eq(0), index = -1, t, addBR
                    , html = tds.filter(':gt(0)').map(function () {
                    t = this.parentNode.rowIndex;
                    addBR = index != -1 && index != t;
                    index = t;
                    return (addBR ? '<br>' : '') + this.innerHTML
                }).get().join(',');
                tds.filter(':gt(0)').remove();
                firstTD.append(',' + html.replace(/，(<br>)/g, '$1'));

                //更新合并的第一个单元格的缓存rc数据为所跨列和行
                var rc = firstTD.attr({
                    colspan: MMRC.endCellIndex - MMRC.startCellIndex + 1,
                    rowspan: MMRC.endRowIndex - MMRC.startRowIndex + 1
                }).data('rc');
                rc.maxc = rc.c + MMRC.endCellIndex - MMRC.startCellIndex;
                rc.maxr = rc.r + MMRC.endRowIndex - MMRC.startRowIndex;

                firstTD.data('rc', rc);

            }
            tb.find('td').removeClass('selected');
            startTD = endTD = null;
        }

        function onMousedown(e) {
            var o = e.target;
            if (o.tagName == 'TD') {
                startTD = o;
                tb.bind({mouseup: onMouseup, mousemove: onMousemove});
            }
        }

        tb.mousedown(onMousedown);
    });
};

$('table').tableMergeCells();