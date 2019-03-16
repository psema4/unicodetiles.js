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
ut.DOMRenderer = function(view) {
	"use strict";
	this.view = view;
    this.z = 0

	// Create a matrix of <span> elements, cache references
	this.spans = new Array(view.h);
	this.colors = new Array(view.h);
	for (var j = 0; j < view.h; ++j) {
		this.spans[j] = new Array(view.w);
		this.colors[j] = new Array(view.w);
		for (var i = 0; i < view.w; ++i) {

// FIXME: TEMPORARY
if (i%2 && j%2) {
    // draw monster cell
    this.spans[j][i] = this.createVolume(`span_${j}_${i}`,i,j,[4,0,0,0,0,0, 1,1],'M',true)

} else if (i==0 || j==0) {
    // draw wall cell
    this.spans[j][i] = this.createVolume(`span_${j}_${i}`,i,j,[4,3,3,3,3,3, 0,0],'#',true)

} else {
    // draw empty cell
    this.spans[j][i] = this.createVolume(`span_${j}_${i}`,i,j,[4,0,0,0,0,0, 0,0],'',true)
}
// FIXME: END TEMPORARY

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

ut.DOMRenderer.prototype.updateStyle = function(s) {
	"use strict";
return

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
};

ut.DOMRenderer.prototype.clear = function() {
	"use strict";
return

	for (var j = 0; j < this.view.h; ++j) {
		for (var i = 0; i < this.view.w; ++i) {
			this.colors[j][i] = "";
		}
	}
};

ut.DOMRenderer.prototype.render = function() {
	"use strict";
return

	var w = this.view.w, h = this.view.h;
	var buffer = this.view.buffer;
	var defaultColor = this.view.defaultColor;
	var defaultBackground = this.view.defaultBackground;
	for (var j = 0; j < h; ++j) {
		for (var i = 0; i < w; ++i) {
			var tile = buffer[j][i];
			var span = this.spans[j][i];
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
		}
	}
};

ut.viewportStyleUpdaterHack = null;

ut.DOMRenderer.prototype.createFace = function(idxFace, styles=[0,0,0,0,0,0, 0,0], textContent='', drawText=false, drawMode=0) {
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

ut.DOMRenderer.prototype.createVolume = function(id, x=0, y=0, styles=[0,0,0,0,0,0, 0,0], textContent='', drawText=false) {
    let faces = []
    let isSprite = textContent=='M' // FIXME: SUPPORT OTHER CHARS AS SPRITES

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
            if (i >= 6)
                tmpDrawText = false
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
ut.DOMRenderer.prototype.tick = function() {
    this.z = this.z || 0

    let sceneTransform = `rotateX(65deg) translateZ(-0px) translateX(-200px) translateY(60px) rotateZ(-${this.z}deg)`

    document.querySelector('.css3d-scene').style.transform = sceneTransform

    if (++this.z > 359)
        this.z = 0
}
