/**
 * @author liang
 * @param {String} boxId为必传生成EC的ID
 * @param {Object} config为配置项
 * @description
 *      引入JS，init图表之后 new myTooltip()，此时可传递config覆盖样式
 *      getPosOrSize('pos', pos)获取tooltip生成位置
 *      getTooltipDom(text)传递需要展示text，获取tooltipDom
 *      text大小需要根据内容进行微调
 */

class myTooltipC {
    constructor (boxId, config = {}) {
        if (!boxId) throw Error('boxId为必传项')
        this.boxId = boxId
        this.config = {
            priority: 'top',        // 默认在点上方OR下方（top/bottom）
            partition: 1.4,         // 左右分割比例
            lineColor: '#fff',      // 引导线颜色
            offset: [5, 5],
            L1: {
                time: 0.3,          // L1动画时长(单位s)
                long: 40            // L1长度
            },
            L2: {
                time: 0.3,
                long: 40
            },
            text: {
                time: 0.5,
                font: '14px Arial',
                color: '#fff',
                padding: [10, 10],
                width: 120,
                height: 60,
                lineHeight: 24,
                backgroundColor: 'rgba(50, 50, 50, 0.8)'
            }
        }
        _.merge(this.config, config, {
            left: false,
            top: false
        })
    }
    getPosOrSize (type, point) {
        let x1 = this.config.L1.long * Math.sin(Math.PI / 4)
        let width = x1 + this.config.L2.long + this.config.text.width
        let height = x1 + this.config.text.height / 2
        if (type === 'size') {
            this.config.width = width
            this.config.height = height
            return {
                width,
                height
            }
        } else {
            let box = document.getElementById(this.boxId)
            let bw = box.offsetWidth
            let bh = box.offsetHeight
            let x = point[0]
            let y = point[1]
            this.config.left = false
            if (x + width >= bw / this.config.partition) {
                x = x - width - this.config.offset[0]
                this.config.left = true
            }
            if (this.config.priority === 'top') {
                // L1向上
                this.config.top = true
                y = y - height - this.config.offset[0]
                if (y <= 0) {
                    y = point[1]
                    this.config.top = false
                }
                return [x, y]
            } else {
                this.config.top = false
                if (y + height >= bh) {
                    y = y - height - this.config.offset[0]
                    this.config.top = true
                }
                return [x, y]
            }
        }
    }
    getTooltipDom (text) {
        if (!text) throw Error('text为必传项')
        return this.clickTrigger(text)
    }
    createTooltip (text) {
        let me = this
        setTimeout(_ => {
            me.t = new createTooltip('tCanvas', me.config, text)
        }, 0)
    }
    clickTrigger (text) {
        this.createTooltip(text)
        let size = this.getPosOrSize('size')
        return `<canvas id="tCanvas" width="${size.width}" height="${size.height}"></canvas>`
    }
}

class createTooltip {
    constructor (id, config, text) {
        this.config = config
        this.text = text
        this.totalTime = 0
        this.over = false
        this.stage = new createjs.Stage(id)
        this.timeline = new TimelineMax({ repeat: 0 })
        this.g = new createjs.Graphics()
        this.lineShape = new createjs.Shape(this.g)
        this.textShape = new createjs.Shape()
        this.stage.addChild(this.lineShape, this.textShape)
        this.init()
        this.begin()
        this.update()
    }
    init () {
        // 根据不同展示位置计算起点位置
        this.start = [0, 0]
        if (this.config.left) {
            this.start[0] = this.config.width
        }
        if (this.config.top) {
            this.start[1] = this.config.height
        }
    }
    begin () {
        this.L1()
        this.L2()
        this.addText()
    }
    L1 () {
        let me = this
        let c = me.config
        let tl = new TimelineMax()
        let scale = { s: 0 }
        let x = c.L1.long * Math.sin(Math.PI / 4)
        if (me.config.left) {
            if (me.config.top) {
                this.L1End = [me.start[0] - x, me.start[1] - x]
            } else {
                this.L1End = [me.start[0] - x, me.start[1] + x]
            }
        } else {
            if (me.config.top) {
                this.L1End = [x, me.start[1] - x]
            } else {
                this.L1End = [x, x]
            }
        }
        tl.to(scale, c.L1.time, {
            s: 1,
            onUpdate () {
                let s = scale.s
                if (me.config.left) {
                    if (me.config.top) {
                        me.g.c().s(c.lineColor).mt(...me.start).lt(me.start[0] - x * s, me.start[1] - x * s)
                    } else {
                        me.g.c().s(c.lineColor).mt(...me.start).lt(me.start[0] - x * s, me.start[1] + x * s)
                    }
                } else {
                    if (me.config.top) {
                        me.g.c().s(c.lineColor).mt(...me.start).lt(x * s, me.start[1] - x * s)
                    } else {
                        me.g.c().s(c.lineColor).mt(...me.start).lt(x * s, x * s)
                    }
                }
                me.update()
            }
        })
        this.timeline.add(tl, this.totalTime)
        this.totalTime += c.L1.time
    }
    L2 () {
        // 只跟左右有关，只判断this.config.left
        let me = this
        let c = me.config
        let tl = new TimelineMax()
        let scale = { s: 0 }
        tl.to(scale, c.L2.time, {
            s: 1,
            onUpdate () {
                let s = scale.s
                if (me.config.left) {
                    me.g.c().s(c.lineColor).mt(...me.start).lt(...me.L1End).lt(me.L1End[0] - c.L2.long * s, me.L1End[1])
                } else {
                    me.g.c().s(c.lineColor).mt(...me.start).lt(...me.L1End).lt(me.L1End[0] + c.L2.long * s, me.L1End[1])
                }
                me.update()
            }
        })
        this.timeline.add(tl, this.totalTime)
        this.totalTime += c.L2.time
    }
    addText () {
        // text框只与L2end有关，只需判断left即可，top不影响
        let me = this
        let c = me.config
        let tl = new TimelineMax()
        let scale = { s: 0 }
        let L2End = [me.L1End[0] + c.L2.long, me.L1End[1]]
        if (me.config.left) {
            L2End = [me.L1End[0] - c.L2.long, me.L1End[1]]
        }
        tl.to(scale, c.text.time, {
            s: 1,
            onStart () {
                let x = 0
                if (me.config.left) {
                    x = L2End[0] - c.text.width
                } else {
                    x = L2End[0]
                }
                me.g.c().s(c.lineColor).mt(...me.start).lt(...me.L1End).lt(...L2End)
                me.text = new createjs.Text(me.text, c.text.font, c.text.color)
                me.text.alpha = 0
                me.text.lineHeight = c.text.lineHeight
                me.text.x = x + c.text.padding[0]
                me.text.y = L2End[1] - c.text.height / 2 + c.text.padding[1]
                me.stage.addChild(me.text)
                me.textShape.graphics.c().f(c.text.backgroundColor).rr(x, L2End[1] - c.text.height / 2, c.text.width, c.text.height, 5)
                me.textShape.alpha = 0
                me.update()
            },
            onUpdate () {
                if (typeof me.text === 'string') return
                me.text.alpha = scale.s
                me.textShape.alpha = scale.s
                me.update()
            },
            onComplete () {
                me.over = true
            }
        })
        this.timeline.add(tl, this.totalTime)
    }
    update () {
        this.stage.update()
    }
}
