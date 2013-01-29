/*global ut */

/// Class: WebGLRenderer
/// Renders the <Viewport> with WebGL.
/// Given decent GPU drivers and browser support, this is the best renderer.
ut.WebGLRenderer = function(view) {
	"use strict";
	this.view = view;
	this.canvas = document.createElement("canvas");
	// Try to fetch the context
	if (!this.canvas.getContext) throw("Canvas not supported");
	this.gl = this.canvas.getContext("experimental-webgl");
	if (!this.gl) throw("WebGL not supported");
	var gl = this.gl;
	view.elem.appendChild(this.canvas);

	this.charMap = {};
	this.charArray = [];
	this.defaultColors = { r: 1.0, g: 1.0, b: 1.0, br: 0.0, bg: 0.0, bb: 0.0 };

	this.attribs = {
		position: { buffer: null, data: null, itemSize: 2, location: null, hint: gl.STATIC_DRAW },
		texCoord: { buffer: null, data: null, itemSize: 2, location: null, hint: gl.STATIC_DRAW },
		color:    { buffer: null, data: null, itemSize: 3, location: null, hint: gl.DYNAMIC_DRAW },
		bgColor:  { buffer: null, data: null, itemSize: 3, location: null, hint: gl.DYNAMIC_DRAW },
		char:     { buffer: null, data: null, itemSize: 1, location: null, hint: gl.DYNAMIC_DRAW }
	};

	function insertQuad(arr, i, x, y, w, h) {
		var x1 = x, y1 = y, x2 = x + w, y2 = y + h;
		arr[  i] = x1; arr[++i] = y1;
		arr[++i] = x2; arr[++i] = y1;
		arr[++i] = x1; arr[++i] = y2;
		arr[++i] = x1; arr[++i] = y2;
		arr[++i] = x2; arr[++i] = y1;
		arr[++i] = x2; arr[++i] = y2;
	}

	this.initBuffers = function() {
		var a, attrib, attribs = this.attribs;
		var w = this.view.w, h = this.view.h;
		// Allocate data arrays
		for (a in this.attribs) {
			attrib = attribs[a];
			attrib.data = new Float32Array(attrib.itemSize * 6 * w * h);
		}
		// Generate static data
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				// Position & texCoords
				var k = attribs.position.itemSize * 6 * (j * w + i);
				insertQuad(attribs.position.data, k, i * this.tw, j * this.th, this.tw, this.th);
				insertQuad(attribs.texCoord.data, k, 0.0, 0.0, 1 / w, 1 / h);
			}
		}
		// Upload
		for (a in this.attribs) {
			attrib = attribs[a];
			if (attrib.buffer) gl.deleteBuffer(attrib.buffer);
			attrib.buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, attrib.buffer);
			gl.bufferData(gl.ARRAY_BUFFER, attrib.data, attrib.hint);
			gl.enableVertexAttribArray(attrib.location);
			gl.vertexAttribPointer(attrib.location, attrib.itemSize, gl.FLOAT, false, 0, 0);
		}
	};

	this.buildTexture = function() {
		var c = 0, ch;
		var w = view.w, h = view.h;
		var hgap = (0.5*this.gap); // Squarification
		this.ctx.fillStyle = "#000000";
		this.ctx.fillRect(0, 0, this.offscreen.width, this.offscreen.height);
		this.ctx.fillStyle = "#ffffff";
		var y = (0.5*this.th)|0; // Half because textBaseline is middle
		for (var j = 0; j < h; ++j) {
			var x = 0;
			for (var i = 0; i < w; ++i, ++c) {
				ch = this.charArray[c];
				if (!ch) break;
				this.ctx.fillText(ch, x + hgap, y);
				x += this.tw;
			}
			if (!ch) break;
			y += this.th;
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreen);
	};

	/// Function: cacheChars
	/// Introduce characters for WebGL renderer. This is also done automatically,
	/// but as an optimization, you can do it yourself beforehand.
	///
	/// Parameters:
	///   chars - (string) the characters to cache
	///   build - (boolean) (optional) - set to false if you don't want to automatically call buildTexture()
	this.cacheChars = function(chars, build) {
		if (!this.gl) return; // Nothing to do if not using WebGL renderer
		var changed = false;
		for (var i = 0; i < chars.length; ++i) {
			if (!this.charMap[chars[i]]) {
				changed = true;
				this.charArray.push(chars[i]);
				this.charMap[chars[i]] = this.charArray.length-1;
			}
		}

		if (changed && build !== false) this.buildTexture();
	};

	this.updateStyle = function(s) {
		s = s || window.getComputedStyle(this.view.elem, null);
		this.ctx.font = s.fontSize + "/" + s.lineHeight + " " + s.fontFamily;
		this.ctx.textBaseline = "middle";
		this.ctx.fillStyle = "#ffffff";
		this.tw = this.ctx.measureText("M").width;
		this.th = parseInt(s.fontSize, 10);
		this.gap = this.view.squarify ? (this.th - this.tw) : 0;
		if (this.view.squarify) this.tw = this.th;
		var color = s.color.match(/\d+/g);
		var bgColor = s.backgroundColor.match(/\d+/g);
		this.defaultColors.r = parseInt(color[0], 10) / 255;
		this.defaultColors.g = parseInt(color[1], 10) / 255;
		this.defaultColors.b = parseInt(color[2], 10) / 255;
		this.defaultColors.br = parseInt(bgColor[0], 10) / 255;
		this.defaultColors.bg = parseInt(bgColor[1], 10) / 255;
		this.defaultColors.bb = parseInt(bgColor[2], 10) / 255;
	};

	// Create an offscreen canvas for rendering text to texture
	if (!this.offscreen)
		this.offscreen = document.createElement("canvas");
	this.offscreen.style.position = "absolute";
	this.offscreen.style.top = "0px";
	this.offscreen.style.left = "0px";
	this.ctx = this.offscreen.getContext("2d");
	// WebGL drawing canvas
	this.updateStyle();
	this.canvas.width = (view.squarify ? this.th : this.tw) * view.w;
	this.canvas.height = this.th * view.h;
	this.offscreen.width = this.canvas.width;
	this.offscreen.height = this.canvas.height;
	// Doing this again since setting canvas w/h resets the state
	this.updateStyle();

	gl.viewport(0, 0, this.canvas.width, this.canvas.height);

	// Setup GLSL
	function compileShader(type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		var ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!ok) {
			var msg = "Error compiling shader: " + gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw msg;
		}
		return shader;
	}
	var vertexShader = compileShader(gl.VERTEX_SHADER, ut.VERTEX_SHADER);
	var fragmentShader = compileShader(gl.FRAGMENT_SHADER, ut.FRAGMENT_SHADER);
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	var ok = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (!ok) {
		var msg = "Error linking program: " + gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw msg;
	}
	gl.useProgram(program);

	// Get attribute locations
	this.attribs.position.location = gl.getAttribLocation(program, "position");
	this.attribs.texCoord.location = gl.getAttribLocation(program, "texCoord");
	this.attribs.color.location    = gl.getAttribLocation(program, "color");
	this.attribs.bgColor.location  = gl.getAttribLocation(program, "bgColor");
	this.attribs.char.location     = gl.getAttribLocation(program, "charIndex");

	// Setup buffers and uniforms
	this.initBuffers();
	var resolutionLocation = gl.getUniformLocation(program, "uResolution");
	gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
	var tileCountsLocation = gl.getUniformLocation(program, "uTileCounts");
	gl.uniform2f(tileCountsLocation, this.view.w, this.view.h);

	// Setup texture
	//view.elem.appendChild(this.offscreen); // Debug offscreen
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	this.cacheChars(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~");
	this.cacheChars("☠☃⚙☻♞☭✈✟✂✯"); // FIXME: Remove
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.activeTexture(gl.TEXTURE0);

	this.clear = function() { /* No op */ };

	this.render = function() {
		gl.clear(gl.COLOR_BUFFER_BIT);
		var attribs = this.attribs;
		var w = this.view.w, h = this.view.h;
		// Create new tile data
		var tiles = this.view.buffer;
		var defaultColor = this.view.defaultColor;
		var defaultBgColor = this.view.defaultBackground;
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				var tile = tiles[j][i];
				var ch = this.charMap[tile.ch] || 0;
				var k = attribs.color.itemSize * 6 * (j * w + i);
				var kk = attribs.char.itemSize * 6 * (j * w + i);
				var r = tile.r === undefined ? this.defaultColors.r : tile.r / 255;
				var g = tile.g === undefined ? this.defaultColors.g : tile.g / 255;
				var b = tile.b === undefined ? this.defaultColors.b : tile.b / 255;
				var br = tile.br === undefined ? this.defaultColors.br : tile.br / 255;
				var bg = tile.bg === undefined ? this.defaultColors.bg : tile.bg / 255;
				var bb = tile.bb === undefined ? this.defaultColors.bb : tile.bb / 255;
				for (var m = 0; m < 6; ++m) {
					var n = k + m * attribs.color.itemSize;
					attribs.color.data[n+0] = r;
					attribs.color.data[n+1] = g;
					attribs.color.data[n+2] = b;
					attribs.bgColor.data[n+0] = br;
					attribs.bgColor.data[n+1] = bg;
					attribs.bgColor.data[n+2] = bb;
					attribs.char.data[kk+m] = ch;
				}
			}
		}
		// Upload
		gl.bindBuffer(gl.ARRAY_BUFFER, attribs.color.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, attribs.color.data, attribs.color.hint);
		gl.bindBuffer(gl.ARRAY_BUFFER, attribs.bgColor.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, attribs.bgColor.data, attribs.bgColor.hint);
		gl.bindBuffer(gl.ARRAY_BUFFER, attribs.char.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, attribs.char.data, attribs.char.hint);

		var attrib = this.attribs.position;
		gl.drawArrays(gl.TRIANGLES, 0, attrib.data.length / attrib.itemSize);
	};
};

ut.VERTEX_SHADER = [
	"attribute vec2 position;",
	"attribute vec2 texCoord;",
	"attribute vec3 color;",
	"attribute vec3 bgColor;",
	"attribute float charIndex;",
	"uniform vec2 uResolution;",
	"uniform vec2 uTileCounts;",
	"varying vec2 vTexCoord;",
	"varying vec3 vColor;",
	"varying vec3 vBgColor;",

	"void main() {",
		"vec2 tileCoords = floor(vec2(mod(charIndex, uTileCounts.x), charIndex / uTileCounts.x));",
		"vTexCoord = texCoord + tileCoords / uTileCounts;",
		"vColor = color;",
		"vBgColor = bgColor;",
		"vec2 pos = position / uResolution * 2.0 - 1.0;",
		"gl_Position = vec4(pos.x, -pos.y, 0.0, 1.0);",
	"}"
].join('\n');

ut.FRAGMENT_SHADER = [
	"precision mediump float;",
	"uniform sampler2D uFont;",
	"varying vec2 vTexCoord;",
	"varying vec3 vColor;",
	"varying vec3 vBgColor;",

	"void main() {",
		"vec4 color = texture2D(uFont, vTexCoord);",
		"color.rgb = mix(vBgColor, vColor, color.rgb);",
		"gl_FragColor = color;",
	"}"
].join('\n');