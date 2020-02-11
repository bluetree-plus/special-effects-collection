;
(function(radius, shadowC) {
	/* 传入的最大扩散半径,阴影颜色(默认黑色) */
	'use strict';
	let arr = [],
		cv = null,
		ctx = null,
		interval = null,
		isResize = false;
	const num = 5; //这个写死了5个圈，这里不能改，否则影响不透明度,线宽
	const _getC = function() {
		return `rgba(${Math.random()*256},${Math.random()*256},${Math.random()*256},`;
	};
	const _draw = function(x, y, obj) {
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = obj.c;
		ctx.lineWidth = 2;
		ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
		ctx.shadowColor = shadowC;
		ctx.shadowBlur = num;
		ctx.arc(x, y, obj.r, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.restore();
	};
	const _init = function() {
		let offsert = Math.floor(radius / num);
		let c = _getC();
		let opacity = 0.5;
		for (let i = 0; i < num; i++, opacity -= 0.1) {
			arr.push({
				r: i * offsert,
				c: c + opacity + ')'
			});
		}
	};
	const _clear = function() {
		window.clearInterval(interval);
		interval = null;
		arr = [];
		_init();
	};

	const _whenClick = function(e) {
		/* 函数防抖 */
		if (interval !== null) {
			_clear();
		}
		e = e || window.event;
		let x = e.clientX,
			y = e.clientY,
			k = 2 * radius;
		interval = window.setInterval(function() {
			ctx.clearRect(0, 0, cv.width, cv.height);
			if (arr[0].r > radius) {
				_clear();
				//console.info('interval is ', interval);
				return;
			}
			for (let i = 0; i < arr.length; i++) {
				if (i === 0 || i !== 0 && arr[i].r <= k) {
					arr[i].r++;
					_draw(x, y, arr[i]);
				}
			}
		}, 1000 / 30);
	};


	(function() {
		/* 创建canvas */
		cv = document.createElement('canvas');
		cv.width = document.documentElement.clientWidth;
		cv.height = document.documentElement.clientHeight;
		ctx = cv.getContext('2d');
		cv.setAttribute('style',
			`pointer-events:none!important;z-index:99999!important;margin:0!important;padding:0!important;left:0!important;top:0!important;position:fixed!important;display:block!important;`
		);
		document.body.appendChild(cv);
		/* 创建水波纹圈数组 */
		_init();
	})();

	window.addEventListener('resize', function() {
		/* 高频调用函数简单做一些防抖处理 */
		if (!isResize) {
			isResize = true;
			window.requestAnimationFrame(() => {
				cv.width = document.documentElement.clientWidth;
				cv.height = document.documentElement.clientHeight;
				isResize = false;
			});
		}
	}, false);

	window.addEventListener('click', _whenClick, false);

	//console.info(arr);

})(30, '#000');
