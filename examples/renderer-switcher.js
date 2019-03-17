/*global term */

function createRendererSwitcher(doSwitch) {
	// Determine the current renderer and the next one
	var curR = term.getRendererString();
	var nextR, pretty;
	if (curR === "webgl") {
		nextR = "canvas";
		pretty = "&lt;canvas&gt;";
    } else if (curR === "canvas") {
        nextR = "css3d";
        pretty = "&lt;css3d&gt;";
	} else if (curR === "css3d") {
		nextR = "dom";
		pretty = "DOM";
	} else {
		nextR = "webgl";
		pretty = "WebGL";
	}
	// Do we switch?
	if (doSwitch) {
        // reset camera & scene
        let camera = document.querySelector('.css3d-camera')
        if (camera) {
            camera.style.top = '0px';
            camera.style.left = '0px';
        }

        let scene = document.querySelector('.css3d-scene')
        if (scene)
            scene.style.transform = ''

		term.setRenderer(nextR);
		term.render();
		createRendererSwitcher(); // Call again to update, but this time no switching
		return;
	}
	// The HTML
	var html = '<p>Renderer: <span id="renderer">'+curR+'</span> ';
	html += '<a onclick="createRendererSwitcher(true)" href="#">Switch to '+pretty+'</button></p>';
	document.getElementById("renderer-switcher").innerHTML = html;
}
