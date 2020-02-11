;
(function(URL) { //传入雪花图片的路径
	'use strict';
	/* 
	 *	2019.12.24
	 */
	let cv = null,
		ctx = null,
		isMove = false,
		isScroll = false,
		isResize = false;

	(function() {
		// 创建canvas
		cv = document.createElement('canvas');
		cv.width = document.documentElement.clientWidth;
		cv.height = document.documentElement.clientHeight;
		ctx = cv.getContext('2d');
		cv.setAttribute('style',
			`pointer-events:none!important;z-index:99999!important;margin:0!important;padding:0!important;left:0!important;top:0!important;position:fixed!important;display:block!important;`
		);
		document.body.appendChild(cv);
	})();


	const OffScreenCvs = function(initY, canvas) {
		this.cv = document.createElement('canvas');
		this.ctx = this.cv.getContext('2d');
		this.cv.width = this.cv.height = OffScreenCvs.const.ITEM_SIZE + Math.random() * OffScreenCvs.const.ITEM_SIZE;
		this.initX = Math.random() * canvas.width;
		this.updateX = null;
		this.updateY = initY;
	};
	OffScreenCvs.const = {
		IMG: new Image(),
		_SAVE_X: null,
		_SAVE_Y: null, //中间缓存
		_ID: null,
		CVS: [], //离屏canvas数组
		ITEM_SIZE: 20, //雪花的初始尺寸，最大不超过40
		AMPLITUDE: 100, //振幅
		INIT_Y: 10, //初始的y轴坐标
		NUMBER_OF: 50, //雪花的数量
		NN: 50,
		KK: Math.PI / 180,
		BORDER_Y: document.documentElement.clientHeight, //边界值
		ADD_Y: 1 //纵向更新基本量
	};
	OffScreenCvs.func = {
		init(canvas) {
			OffScreenCvs.const.IMG.src = URL;
			let CVS = OffScreenCvs.const.CVS;

			for (let i = 0; i < OffScreenCvs.const.NUMBER_OF; i++) {
				let j = i > OffScreenCvs.const.NN ? OffScreenCvs.const.NN : i;
				// 如何获得一个较大的离散分布区间 ??
				// 这里是用的最简单粗暴的 循环控制变量 与 初始值的 乘积
				// 当循环控制变量超过 50 后就不变了，这样难以获得一个稳定的离散分布区间
				// 		* 这里还有一个曲线救国的方法，通过监听鼠标移动，人为地打散雪花粒子
				CVS[i] = new OffScreenCvs(OffScreenCvs.const.INIT_Y * j, canvas);
			}
			return new Promise((resolve, reject) => {
				window.addEventListener('load', () => {
					try {
						for (let i = 0; i < OffScreenCvs.const.NUMBER_OF; i++) {
							let _ctx = CVS[i].ctx;
							_ctx.save();
							// _ctx.strokeStyle = 'rgba(255,0,0,1)';
							// _ctx.strokeRect(0, 0, CVS[i].cv.width, CVS[i].cv.height);
							// console.info(CVS[i].cv.width, CVS[i].cv.height);
							_ctx.drawImage(OffScreenCvs.const.IMG, 0, 0, CVS[i].cv.width, CVS[i].cv.height);
							_ctx.restore();
						}
						resolve();
					} catch (e) {
						reject(e);
					}
				}, false);
			});
		},
		update(canvas, context) {
			// 这里是高频调用作用域，在一帧动画内尽量减少这里的逻辑运算
			context.clearRect(0, 0, canvas.width, canvas.height);
			let CVS = OffScreenCvs.const.CVS;
			for (let i = 0; i < CVS.length; i++) {
				let item = CVS[i];
				// 做边界判断
				if (item.updateY > OffScreenCvs.const.BORDER_Y) {
					// 重置一下
					item.initX = Math.random() * canvas.width;
					item.updateY = Math.random() * OffScreenCvs.const.INIT_Y;
				}
				item.updateY += OffScreenCvs.const.ADD_Y;
				item.updateX = item.initX + OffScreenCvs.const.AMPLITUDE * Math.sin(item.updateY * OffScreenCvs.const.KK);
				context.save();
				context.drawImage(item.cv, item.updateX, item.updateY, item.cv.width, item.cv.height);
				context.restore();
			}
			OffScreenCvs.const._ID = requestAnimationFrame(OffScreenCvs.func.update.bind(null, canvas, context));
		},
		getDistance(x1, y1, x2, y2) {
			let X = Math.pow(Math.abs(x1 - x2), 2),
				Y = Math.pow(Math.abs(y1 - y2), 2);
			return Math.sqrt(X + Y);
		},
		callback(e) {
			if (!isMove) {
				isMove = true;
				window.requestAnimationFrame(() => {
					let x = e.clientX,
						y = e.clientY;
					if (x !== OffScreenCvs.const._SAVE_X && y !== OffScreenCvs.const._SAVE_Y) {
						let CVS = OffScreenCvs.const.CVS;
						for (let i = 0; i < CVS.length; i++) {
							let item = CVS[i];
							let flag = OffScreenCvs.func.getDistance(x, y, item.updateX, item.updateY) < OffScreenCvs.const.AMPLITUDE ?
								true : false;
							if (flag && OffScreenCvs.const._ID !== null) {
								/* 这里不必要对 updateX 做相同的处理 */
								if (item.updateY < y) {
									item.updateY -= OffScreenCvs.const.ITEM_SIZE;
								} else if (item.updateY > y) {
									item.updateY += OffScreenCvs.const.ITEM_SIZE;
								}
							}
						}
						OffScreenCvs.const._SAVE_X = x;
						OffScreenCvs.const._SAVE_Y = y;
					}
					isMove = false;
				});
			}
		}
	};

	OffScreenCvs.func.init(cv).then(() => {
		//	只有离屏canvas全部画完后才执行本作用域内以下操作,这里是JS异步操作
		OffScreenCvs.func.update(cv, ctx);

		window.addEventListener('scroll', function(e) {
			if (!isScroll) {
				isScroll = true;
				window.requestAnimationFrame(() => {
					const H = document.documentElement.clientHeight;
					let st = document.documentElement.scrollTop || document.body.scrollTop;
					if (st > H) {
						if (OffScreenCvs.const._ID !== null) {
							window.cancelAnimationFrame(OffScreenCvs.const._ID);
							OffScreenCvs.const._ID = null;
							ctx.clearRect(0, 0, cv.width, cv.height);
							/* console.info(st, H); */
						}
					} else {
						if (OffScreenCvs.const._ID === null) {
							OffScreenCvs.func.update(cv, ctx);
						}
					}
					isScroll = false;
				});
			}
		}, false);

		window.addEventListener('mousemove', function(e) {
			OffScreenCvs.func.callback(e);
		}, false);

		/* window.addEventListener('dblclick', function() {
			if (OffScreenCvs.const._ID !== null) {
				console.info(OffScreenCvs.const._ID);
				window.cancelAnimationFrame(OffScreenCvs.const._ID);
				OffScreenCvs.const._ID = null;
			} else {
				OffScreenCvs.func.update(cv, ctx);
			}
		}, false); */

		window.addEventListener('resize', function() {
			/* 高频调用函数简单做一些节流处理 */
			if (!isResize) {
				isResize = true;
				window.requestAnimationFrame(() => {
					cv.width = document.documentElement.clientWidth;
					cv.height = document.documentElement.clientHeight;
					isResize = false;
				});
			}
		}, false);

	}).catch((e) => {
		console.error('!!! promise error: ', e);
	});

})('./1.png');
