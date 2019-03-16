/*global ut */

// *** WARNING ***
// PROTOTYPE. HERE BE DRAGONS
// BASED ON DOMRenderer
//
// SEE ALSO ~/devel/js1kx/src

/// Class: CSS3DRenderer (Customized DOMRenderer)
/// Renders the <Viewport> into DOM elements.
///
/// *Note:* This is an internal class used by <Viewport>
ut.CSS3DRenderer = function(view) {
	"use strict";
	this.view = view;
    this.z = 0

	// Create a matrix of .volume elements, cache references
	this.spans = new Array(view.h);
	this.colors = new Array(view.h);
	for (var j = 0; j < view.h; ++j) {
		this.spans[j] = new Array(view.w);
		this.colors[j] = new Array(view.w);
		for (var i = 0; i < view.w; ++i) {
            this.spans[j][i] = this.createVolume(`span_${j}_${i}`,i,j,[0,0,0,0,0,0, 0,0],'',true)
			view.elem.appendChild(this.spans[j][i]);
		}
		// Line break
		this.spans[j].push(document.createElement("br"));
		view.elem.appendChild(this.spans[j][view.w]);
	}

	ut.viewportStyleUpdaterHack = this;
    setTimeout(function() { ut.viewportStyleUpdaterHack.updateStyle(); }, 0);

    // FIXME: LAUNCH FROM CONSOLE OR UI
    // setInterval(function() { ut.viewportStyleUpdaterHack.tick() }, 1000)
};

ut.CSS3DRenderer.prototype.updateStyle = function(s) {
	"use strict";
    /*
	s = window.getComputedStyle(this.spans[0][0], null);
	this.tw = parseInt(s.width, 10);
	if (this.tw === 0 || isNaN(this.tw)) return; // Nothing to do, exit
	this.th = parseInt(s.height, 10);
	if (this.view.squarify) this.tw = this.th;
	var w = this.view.w, h = this.view.h;
	for (var j = 0; j < h; ++j) {
		for (var i = 0; i < w; ++i) {
			this.spans[j][i].style.width = this.tw + "px";
		}
	}
    */

    console.info('ut.CSS3DRenderer.updateStyle(): SKIP')
    return
};

ut.CSS3DRenderer.prototype.clear = function() {
	"use strict";

	for (var j = 0; j < this.view.h; ++j) {
		for (var i = 0; i < this.view.w; ++i) {
			this.colors[j][i] = "";
		}
	}
};

ut.CSS3DRenderer.prototype.render = function() {
	"use strict";

	var w = this.view.w, h = this.view.h;
	var buffer = this.view.buffer;
	var defaultColor = this.view.defaultColor;
	var defaultBackground = this.view.defaultBackground;
	for (var j = 0; j < h; ++j) {
		for (var i = 0; i < w; ++i) {
			var tile = buffer[j][i];
			var span = this.spans[j][i];

            /*
			// Check and update colors
			var fg = tile.r === undefined ? defaultColor : tile.getColorRGB();
			var bg = tile.br === undefined ? defaultBackground : tile.getBackgroundRGB();
			var colorHash = fg + bg;
			if (colorHash !== this.colors[j][i]) {
				this.colors[j][i] = colorHash;
				span.style.color = fg;
				span.style.backgroundColor = bg;
			}

			// Check and update character
			var ch = tile.getChar();
			if (ch !== span.innerHTML) {
				span.innerHTML = ch;

                // update css3d data
                //span.classList.remove('');
                //span.classList.add('');
                //spans.dataset.foo = '';
            }
            */

            // Check and update volumes
            // FIXME: update colors as in original
            let ch = tile.getChar();
            let volData = this.getVolumeData(span)
            if (ch !== volData.ch) {
                // tile has changed, create a temporary volume and swap it's contents into the rendered volume
                // console.info(`ut.CSS3DRenderer.render(): j:${j}, i:${i}, tile ch:"${ch}", volume data:`, volData)
                let newSpan = false

                if (ch == ' ') {
                    newSpan = this.createVolume(`span_${j}_${i}`,i,j,[0,0,0,0,0,0, 0,0],'',true)

                } if (ch == '.') {
                    newSpan = this.createVolume(`span_${j}_${i}`,i,j,[4,0,0,0,0,0, 0,0],'',true)

                } else if (ch == '▒') {
                    newSpan = this.createVolume(`span_${j}_${i}`,i,j,[1,1,1,1,1,1, 0,0],ch,true)

                } else if (ch == '@') {
                    newSpan = this.createVolume(`span_${j}_${i}`,i,j,[4,0,0,0,0,0, 0,0],ch,true)
                }

                this.spans[j][i].innerHTML = newSpan.innerHTML
            }
		}
	}
};

ut.viewportStyleUpdaterHack = null;

ut.CSS3DRenderer.prototype.createFace = function(idxFace, styles=[0,0,0,0,0,0, 0,0], textContent='', drawText=false, drawMode=0) {
    let classNames = [
        'transparent',  // 0
        'black',        // 1
        'white',        // 2
        'red',          // 3
        'green',        // 4
        'blue',         // 5
        'yellow',       // 6
    ]

    if (drawText) {
        if (drawMode === 0) {
            if (idxFace >= 6 ) {
                textContent = ''
            }
        }

        if (drawMode === 1) {
            if (idxFace < 6) {
                textContent = ''
            }
        }

    } else {
        textContent = ''
    }

    if (textContent === '')
        drawText = false

    let template = `<div class="face${idxFace} ${classNames[ styles[idxFace] ]}">${textContent}</div>`

    return template
}

ut.CSS3DRenderer.prototype.createVolume = function(id, x=0, y=0, styles=[0,0,0,0,0,0, 0,0], textContent='', drawText=false) {
    let faces = []

    let sprites = '@M'.split('')
    let walls = '#▒'.split('')
    let floors = ' .'.split('')

    let isSprite = sprites.includes(textContent)
    let isWall = !isSprite
    let isFloor = isWall && floors.includes(textContent)

    for (let i=0; i < 8; i++) {
        let tmpDrawText = drawText
        let drawMode = 0

        if (isSprite) {
            // only drawText on interior faces
            if (i >= 6)
                drawMode = 1
            else
                tmpDrawText = false

        } else {
            // not a sprite, only drawText on exterior faces
            if (isFloor) {
                if (i > 0)
                    tmpDrawText = false

            } else {
                if (i >= 6)
                    tmpDrawText = false
            }
        }

        faces.push(this.createFace(i, styles, textContent, tmpDrawText, drawMode))
    }

    let volume = document.createElement('div')
    volume.id = id
    volume.classList.add('volume')
    volume.dataset.y = y
    volume.dataset.x = x
    volume.innerHTML = faces.join('')

    return volume
}

// auto-rotate camera
ut.CSS3DRenderer.prototype.tick = function() {
    this.z = this.z || 0

    let sceneTransform = `rotateX(65deg) translateZ(-0px) translateX(-200px) translateY(60px) rotateZ(-${this.z}deg)`

    document.querySelector('.css3d-scene').style.transform = sceneTransform

    if (++this.z > 359)
        this.z = 0
}

// get color & character data from a volume
ut.CSS3DRenderer.prototype.getVolumeData = function(span) {
    let data = {
        ch: ' ',
        x: 0,
        y: 0,
        color: '#000',
        background: '#000',
        span: false,
    }

    data.ch = span && span.innerText && span.innerText.replace(/\n/g,'').replace(/ /g, '').split('')[0]
    if (data.ch == '' || data.ch.length < 1)
        data.ch = ' '

    data.y = span && span.dataset && span.dataset.y
    data.x = span && span.dataset && span.dataset.x

    data.span = document.querySelector(`[data-x*="${data.x}"][data-y*="${data.y}"]`) 
    if (data.span.id !== span.id)
        console.warn('! SPAN ID\'S DO NOT MATCH !')

    if (data.ch == '#') {
        data.color = '#fff'
        data.background = '#f00'

    } else if (data.ch == 'M') {
        data.color = '#00f'
        data.background = '#000'

    } else {
        data.color = '#ff0'
        data.background = '#0f0'
    }

    return data
}
