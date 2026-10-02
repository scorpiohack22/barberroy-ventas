/*
 * BarberRoy Academy — promo animation builder for Adobe After Effects
 * ---------------------------------------------------------------------
 * File > Scripts > Run Script File...  and pick this file.
 *
 * Builds a fully editable project from the brand assets in ./assets:
 *   - one precomp per slide (live text layers, shape layers, image layers)
 *   - text reveals driven by Text Animators (editable range selectors)
 *   - push / zoom / blur / wipe transitions keyframed in the MAIN comp
 *   - image motion (slow push + drift) plus a beat pulse expression
 *   - all timing derived from CONFIG.bpm / CONFIG.offset, with beat and
 *     bar markers, so everything lands on the music
 *
 * Drop your music track into ./audio (mp3, wav, aif or m4a) before running.
 * Change the tempo or downbeat below and re-run to re-time the whole edit.
 *
 * Written for ExtendScript (ES3): no let/const, no arrow functions.
 */
(function () {

    // ------------------------------------------------------------------
    // CONFIG — everything you are likely to tweak lives here
    // ------------------------------------------------------------------
    var CONFIG = {
        projectName: "BR_Promo",
        width: 1920,
        height: 1080,
        fps: 30,

        // Music timing. 120 BPM / 0.21s downbeat matches the reference cut.
        bpm: 120,
        offset: 0.21,          // seconds before the first downbeat
        beatsPerBar: 4,
        beatPulse: 1.6,        // % scale bump on every beat (0 = off)

        colors: {
            black:   "#0a0a0a",
            ink:     "#141414",
            white:   "#ffffff",
            paper:   "#f6f3ee",
            red:     "#e3262f",
            redDeep: "#b8131c",
            orange:  "#ff6a1a",
            grey:    "#8a8a8a"
        },

        // PostScript names of the brand fonts (Google Fonts, static files).
        fonts: {
            display: "Anton-Regular",
            body:    "Manrope-Medium",
            bodyB:   "Manrope-Bold",
            label:   "Archivo-ExtraBold"
        }
    };

    var W = CONFIG.width, H = CONFIG.height;
    var BEAT = 60 / CONFIG.bpm;
    var BAR = BEAT * CONFIG.beatsPerBar;
    var MAIN_NAME = "BR_MAIN";
    var root = new File($.fileName).parent;

    // ------------------------------------------------------------------
    // Utilities
    // ------------------------------------------------------------------
    function hex(c) {
        c = c.replace("#", "");
        return [parseInt(c.substr(0, 2), 16) / 255,
                parseInt(c.substr(2, 2), 16) / 255,
                parseInt(c.substr(4, 2), 16) / 255];
    }

    function easeDims(prop) {
        var t = prop.propertyValueType;
        if (t === PropertyValueType.TwoD) { return 2; }
        if (t === PropertyValueType.ThreeD) { return 3; }
        return 1; // 1D and spatial properties take a single ease
    }

    // Keyframe helper: keys = [[time, value], ...]. Ease in/out on every key.
    function keys(prop, list, infl) {
        var i, k, d, e, arr;
        infl = infl || 75;
        for (i = 0; i < list.length; i++) {
            prop.setValueAtTime(list[i][0], list[i][1]);
        }
        d = easeDims(prop);
        for (i = 1; i <= prop.numKeys; i++) {
            arr = [];
            for (k = 0; k < d; k++) { arr.push(new KeyframeEase(0, infl)); }
            e = arr;
            prop.setTemporalEaseAtKey(i, e, e);
        }
    }

    function folder(name, parent) {
        var f = app.project.items.addFolder(name);
        if (parent) { f.parentFolder = parent; }
        return f;
    }

    function importFile(path, into) {
        var f = new File(path);
        if (!f.exists) { return null; }
        var item = app.project.importFile(new ImportOptions(f));
        if (into) { item.parentFolder = into; }
        return item;
    }

    function newComp(name, dur, into) {
        var c = app.project.items.addComp(name, W, H, 1, dur, CONFIG.fps);
        c.bgColor = hex(CONFIG.colors.black);
        c.motionBlur = true;
        c.shutterAngle = 220;
        if (into) { c.parentFolder = into; }
        return c;
    }

    function solid(comp, color, name) {
        var l = comp.layers.addSolid(hex(color), name, W, H, 1, comp.duration);
        l.locked = true;
        return l;
    }

    // ---------------- text ----------------
    // opts: font, size, color, x, y, tracking, leading, justify ("left"|"center"|"right")
    function text(comp, str, opts) {
        var l = comp.layers.addText(str);
        var p = l.property("ADBE Text Properties").property("ADBE Text Document");
        var td = p.value;
        try { td.resetCharStyle(); } catch (e0) {}
        td.font = opts.font || CONFIG.fonts.body;
        td.fontSize = opts.size || 48;
        td.applyFill = true;
        td.fillColor = hex(opts.color || CONFIG.colors.white);
        td.applyStroke = false;
        td.tracking = opts.tracking || 0;
        if (opts.leading) {
            try { td.autoLeading = false; } catch (e1) {}
            td.leading = opts.leading;
        }
        td.justification = opts.justify === "center" ? ParagraphJustification.CENTER_JUSTIFY :
                           opts.justify === "right" ? ParagraphJustification.RIGHT_JUSTIFY :
                           ParagraphJustification.LEFT_JUSTIFY;
        p.setValue(td);
        l.name = opts.name || str.replace(/\r/g, " ").substr(0, 28);
        l.property("ADBE Transform Group").property("ADBE Position").setValue([opts.x, opts.y]);
        l.motionBlur = true;
        return l;
    }

    function animator(layer, name) {
        var a = layer.property("ADBE Text Properties").property("ADBE Text Animators")
                     .addProperty("ADBE Text Animator");
        a.name = name;
        return a;
    }

    function selector(anim, basedOn, shapeRampUp) {
        var s = anim.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        try {
            var adv = s.property("ADBE Text Range Advanced");
            adv.property("ADBE Text Range Type2").setValue(basedOn); // 1 chars, 3 words, 4 lines
            if (shapeRampUp) { adv.property("ADBE Text Range Shape").setValue(2); } // Ramp Up
            adv.property("ADBE Text Levels Max Ease").setValue(60);
        } catch (e) {}
        return s;
    }

    // Classic slide-up + fade reveal, word by word (or line by line).
    // Fully editable afterwards: Animator "Reveal" > Range Selector > Start.
    function revealUp(layer, t, dur, opts) {
        opts = opts || {};
        var a = animator(layer, "Reveal");
        var props = a.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Position 3D").setValue([0, opts.dist || 70, 0]);
        props.addProperty("ADBE Text Opacity").setValue(0);
        if (opts.blur) { props.addProperty("ADBE Text Blur").setValue([opts.blur, opts.blur]); }
        var s = selector(a, opts.basedOn || 3, true);
        keys(s.property("ADBE Text Percent Start"), [[t, 0], [t + dur, 100]], 70);
        return a;
    }

    // Blur + tracking-in reveal for big display words ("HASTA HOY." style).
    function revealBlur(layer, t, dur) {
        var a = animator(layer, "Blur In");
        var props = a.property("ADBE Text Animator Properties");
        props.addProperty("ADBE Text Blur").setValue([40, 0]);
        props.addProperty("ADBE Text Opacity").setValue(0);
        props.addProperty("ADBE Text Tracking Amount").setValue(120);
        var s = selector(a, 1, true);
        keys(s.property("ADBE Text Percent Start"), [[t, 0], [t + dur, 100]], 80);
        return a;
    }

    // ---------------- shapes ----------------
    function shapeGroup(layer, name) {
        var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        g.name = name;
        return g.property("ADBE Vectors Group");
    }

    function addStroke(contents, color, width) {
        var s = contents.addProperty("ADBE Vector Graphic - Stroke");
        s.property("ADBE Vector Stroke Color").setValue(hex(color));
        s.property("ADBE Vector Stroke Width").setValue(width);
        return s;
    }

    function addFill(contents, color) {
        var f = contents.addProperty("ADBE Vector Graphic - Fill");
        f.property("ADBE Vector Fill Color").setValue(hex(color));
        return f;
    }

    function addTrim(contents, t, dur) {
        var tr = contents.addProperty("ADBE Vector Filter - Trim");
        keys(tr.property("ADBE Vector Trim End"), [[t, 0], [t + dur, 100]], 85);
        return tr;
    }

    // Line drawn on with trim paths (underline / divider).
    function line(comp, name, x, y, len, color, width, t, dur) {
        var l = comp.layers.addShape();
        l.name = name;
        var c = shapeGroup(l, "Line");
        var path = c.addProperty("ADBE Vector Shape - Group");
        var sh = new Shape();
        sh.vertices = [[0, 0], [len, 0]];
        sh.closed = false;
        path.property("ADBE Vector Shape").setValue(sh);
        addTrim(c, t, dur);
        addStroke(c, color, width);
        l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        return l;
    }

    // Circle stroke drawn on with trim paths ("MAKE IT YOURS" ring).
    function ring(comp, name, x, y, d, color, width, t, dur) {
        var l = comp.layers.addShape();
        l.name = name;
        var c = shapeGroup(l, "Ring");
        c.addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([d, d]);
        addTrim(c, t, dur);
        addStroke(c, color, width);
        l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        l.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(-90);
        return l;
    }

    // Filled rectangle centred on (x, y).
    function rect(comp, name, x, y, w, h, color, round) {
        var l = comp.layers.addShape();
        l.name = name;
        var c = shapeGroup(l, "Rect");
        var r = c.addProperty("ADBE Vector Shape - Rect");
        r.property("ADBE Vector Rect Size").setValue([w, h]);
        if (round) { r.property("ADBE Vector Rect Roundness").setValue(round); }
        addFill(c, color);
        l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        return l;
    }

    // ---------------- images ----------------
    // Beat pulse expression. sceneStart is baked in so beats line up with
    // MAIN time; tempo/offset/amount are read live from the CONTROL null.
    function pulseExpr(sceneStart) {
        return [
            "// Beat pulse — tweak on " + MAIN_NAME + " > CONTROL",
            "var C = comp(\"" + MAIN_NAME + "\").layer(\"CONTROL\");",
            "var bpm = C.effect(\"BPM\")(\"Slider\");",
            "var off = C.effect(\"Downbeat Offset (s)\")(\"Slider\");",
            "var amt = C.effect(\"Beat Pulse %\")(\"Slider\");",
            "var t = time + " + sceneStart.toFixed(4) + " - off;",
            "var ph = t < 0 ? 1 : (t * bpm / 60) % 1;",
            "var k = 1 + (amt / 100) * Math.exp(-ph * 7);",
            "[value[0] * k, value[1] * k];"
        ].join("\n");
    }

    // Full-bleed or framed image with slow push-in + drift.
    // opts: x, y, w, h (frame to cover), zoom (end scale factor), drift [dx,dy],
    //       feather (left-edge fade in px), t0, t1, sceneStart
    function image(comp, item, opts) {
        var l = comp.layers.add(item);
        l.name = opts.name || item.name;
        l.motionBlur = true;
        l.quality = LayerQuality.BEST;
        var fw = opts.w || W, fh = opts.h || H;
        var cover = Math.max(fw / item.width, fh / item.height) * 100;
        var z = opts.zoom || 1.08;
        var tr = l.property("ADBE Transform Group");
        var cx = opts.x !== undefined ? opts.x : W / 2;
        var cy = opts.y !== undefined ? opts.y : H / 2;
        var dr = opts.drift || [0, 0];
        var t0 = opts.t0 || 0, t1 = opts.t1 || comp.duration;
        keys(tr.property("ADBE Scale"), [[t0, [cover, cover]], [t1, [cover * z, cover * z]]], 30);
        keys(tr.property("ADBE Position"), [[t0, [cx, cy]], [t1, [cx + dr[0], cy + dr[1]]]], 30);
        if (CONFIG.beatPulse > 0 && opts.sceneStart !== undefined) {
            tr.property("ADBE Scale").expression = pulseExpr(opts.sceneStart);
        }
        // Crop to frame when the frame is smaller than the comp.
        if (opts.w || opts.h || opts.feather) {
            var m = l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
            m.name = "Frame";
            var s = new Shape();
            var sc = cover / 100;
            var hw = fw / 2 / sc, hh = fh / 2 / sc;
            var ax = item.width / 2, ay = item.height / 2;
            s.vertices = [[ax - hw, ay - hh], [ax + hw, ay - hh], [ax + hw, ay + hh], [ax - hw, ay + hh]];
            s.closed = true;
            m.property("ADBE Mask Shape").setValue(s);
            if (opts.feather) {
                m.property("ADBE Mask Feather").setValue([opts.feather / sc, 0]);
            }
        }
        return l;
    }

    // Card that slides up into place (portfolio grid).
    function card(comp, item, x, y, w, h, t, dur, sceneStart) {
        var l = image(comp, item, { x: x, y: y, w: w, h: h, zoom: 1.06, sceneStart: sceneStart });
        var tr = l.property("ADBE Transform Group");
        // Card entrance lives on the opacity + a parent null, so the image's own
        // push-in keys stay independent and editable.
        var n = comp.layers.addNull();
        n.name = l.name + " (move)";
        n.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        l.parent = n;
        keys(n.property("ADBE Transform Group").property("ADBE Position"),
             [[t, [x, y + 260]], [t + dur, [x, y]]], 88);
        keys(tr.property("ADBE Opacity"), [[t, 0], [t + dur * 0.6, 100]], 60);
        return l;
    }

    // Number counter: Source Text expression reads a slider, prefix/suffix editable in the expression.
    function counter(comp, opts, from, to, t, dur, prefix, suffix) {
        var l = text(comp, prefix + to + suffix, opts);
        var fx = l.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        fx.name = "Value";
        keys(fx.property("ADBE Slider Control-0001"), [[t, from], [t + dur, to]], 85);
        l.property("ADBE Text Properties").property("ADBE Text Document").expression =
            "var prefix = \"" + prefix + "\";\nvar suffix = \"" + suffix + "\";\n" +
            "prefix + Math.round(effect(\"Value\")(\"Slider\")) + suffix;";
        return l;
    }

    // ------------------------------------------------------------------
    // Project setup
    // ------------------------------------------------------------------
    app.beginUndoGroup("Build BarberRoy promo");
    if (!app.project) { app.newProject(); }

    var fRoot = folder(CONFIG.projectName);
    var fScenes = folder("01_Scenes", fRoot);
    var fImages = folder("02_Images", fRoot);
    var fAudio = folder("03_Audio", fRoot);

    var IMG = {};
    var imgNames = [
        "work-silver-mohawk.jpg", "work-pink-mohawk.jpg", "work-pink-silver-glasses.jpg",
        "work-ice-blue.jpg", "work-neon-flattop.jpg", "work-yellow-silver.jpg",
        "work-silver-hand.jpg", "class-lavender.jpg", "class-pink.jpg",
        "students-certificates.jpg", "roy-portrait.png", "roy-stage.png",
        "roy-beauty-fair.png", "chat-01.jpg", "chat-02.jpg"
    ];
    var missing = [];
    for (var ii = 0; ii < imgNames.length; ii++) {
        var key = imgNames[ii].replace(/\.(jpg|png)$/, "");
        IMG[key] = importFile(root.fsName + "/assets/images/" + imgNames[ii], fImages);
        if (!IMG[key]) { missing.push(imgNames[ii]); }
    }
    if (missing.length) {
        alert("Missing images in assets/images:\n" + missing.join("\n"));
        app.endUndoGroup();
        return;
    }

    var music = null;
    var audioDir = new Folder(root.fsName + "/audio");
    if (audioDir.exists) {
        var af = audioDir.getFiles(/\.(mp3|wav|aif|aiff|m4a)$/i);
        if (af.length) { music = importFile(af[0].fsName, fAudio); }
    }

    var C = CONFIG.colors, F = CONFIG.fonts;

    // ------------------------------------------------------------------
    // Scenes. Each one: name, bars, transition IN, build(comp, sceneStart).
    // Times inside build() are in beats via b(n) -> seconds.
    // ------------------------------------------------------------------
    function b(n) { return n * BEAT; }

    function logo(comp, color, t) {
        var l = text(comp, "BARBERROY ACADEMY", {
            font: F.label, size: 22, tracking: 400, color: color || C.white,
            x: 96, y: 110, name: "Logo"
        });
        revealUp(l, t || 0, b(1), { basedOn: 1, dist: 20 });
        return l;
    }

    function eyebrow(comp, str, x, y, color, t) {
        var l = text(comp, str, { font: F.label, size: 18, tracking: 300, color: color || C.red, x: x, y: y, name: "Eyebrow" });
        revealUp(l, t, b(1), { basedOn: 1, dist: 16 });
        return l;
    }

    var SCENES = [
        { name: "S01_Hook", bars: 1, trans: "cut", build: function (c, s0) {
            image(c, IMG["work-silver-mohawk"], { zoom: 1.12, drift: [-40, 0], sceneStart: s0 });
            logo(c, C.white, b(0.25));
            var t = text(c, "Diseñado\rpara destacar.", { font: F.body, size: 64, leading: 72, x: 96, y: 860 });
            revealUp(t, b(1), b(1.5), { basedOn: 4 });
        }},

        { name: "S02_Promise", bars: 2, trans: "push", build: function (c, s0) {
            var ghost = text(c, "COLOR", { font: F.display, size: 440, color: C.white, x: 70, y: 620, name: "Ghost word" });
            ghost.property("ADBE Transform Group").property("ADBE Opacity").setValue(7);
            keys(ghost.property("ADBE Transform Group").property("ADBE Position"), [[0, [70, 620]], [b(8), [-140, 620]]], 20);
            image(c, IMG["work-pink-mohawk"], { x: 1488, w: 864, feather: 260, zoom: 1.1, drift: [0, -30], sceneStart: s0 });
            eyebrow(c, "COLORIMETRÍA CAPILAR", 140, 360, C.red, b(0.5));
            var h = text(c, "Domina el color\ry cobra lo que vales.", { font: F.body, size: 72, leading: 84, x: 140, y: 470 });
            revealUp(h, b(1), b(2), { basedOn: 4 });
            var sub = text(c, "No improvises más. Formula, corrige y trabaja con seguridad.", { font: F.body, size: 24, color: C.grey, x: 140, y: 680 });
            revealUp(sub, b(3), b(1.5), { basedOn: 3, dist: 24 });
            line(c, "Underline", 140, 760, 220, C.red, 3, b(4), b(1));
        }},

        { name: "S03_Pain", bars: 2, trans: "zoom", build: function (c, s0) {
            var bg = image(c, IMG["work-silver-hand"], { zoom: 1.06, sceneStart: s0 });
            bg.property("ADBE Transform Group").property("ADBE Opacity").setValue(28);
            eyebrow(c, "¿TE SUENA FAMILIAR?", 140, 300, C.red, 0);
            var lines = ["Mezclas “a ojo”.", "Cobras menos de lo que vales.", "Corriges sin método."];
            for (var i = 0; i < lines.length; i++) {
                var tIn = b(1 + i * 2);
                var x = rect(c, "Mark " + (i + 1), 146, 422 + i * 130, 12, 64, C.red, 0);
                keys(x.property("ADBE Transform Group").property("ADBE Scale"), [[tIn, [100, 0]], [tIn + b(0.5), [100, 100]]], 85);
                var l = text(c, lines[i], { font: F.body, size: 60, x: 184, y: 445 + i * 130 });
                revealUp(l, tIn, b(1), { basedOn: 3, dist: 40 });
            }
        }},

        { name: "S04_Turn", bars: 1, trans: "cut", build: function (c, s0) {
            solid(c, C.red, "BG Red");
            var t = text(c, "HASTA\rHOY.", { font: F.display, size: 260, leading: 250, color: C.black, x: 140, y: 470 });
            revealBlur(t, 0, b(1.5));
            line(c, "Dash", 150, 860, 140, C.black, 6, b(2), b(1));
        }},

        { name: "S05_Program", bars: 3, trans: "push", build: function (c, s0) {
            image(c, IMG["class-lavender"], { x: 1488, w: 864, feather: 260, zoom: 1.1, drift: [-20, 0], sceneStart: s0 });
            eyebrow(c, "EL PROGRAMA", 140, 210, C.red, 0);
            var h = text(c, "6 módulos.\rUn método.", { font: F.body, size: 72, leading: 84, x: 140, y: 310 });
            revealUp(h, b(0.5), b(1.5), { basedOn: 4 });
            var mods = ["Fundamentos", "Formulación y mezcla", "Decoloración", "Corrección de color", "Técnicas tendencia", "Negocio del color"];
            for (var i = 0; i < mods.length; i++) {
                var tIn = b(2 + i * 1.5);
                var y = 520 + i * 72;
                var n = text(c, "0" + (i + 1), { font: F.display, size: 40, color: C.red, x: 140, y: y, name: "Num 0" + (i + 1) });
                revealUp(n, tIn, b(0.75), { basedOn: 1, dist: 30 });
                var m = text(c, mods[i], { font: F.bodyB, size: 36, x: 220, y: y, name: "Module 0" + (i + 1) });
                revealUp(m, tIn + b(0.25), b(0.75), { basedOn: 3, dist: 30 });
            }
        }},

        { name: "S06_Portfolio", bars: 2, trans: "wipe", build: function (c, s0) {
            var h = text(c, "Resultados que hablan por sí solos.", { font: F.body, size: 40, x: W / 2, y: 150, justify: "center" });
            revealUp(h, 0, b(1.5), { basedOn: 3, dist: 30 });
            var picks = ["work-pink-silver-glasses", "work-ice-blue", "work-neon-flattop"];
            var labels = ["ROSA / PLATA", "AZUL HIELO", "FLAT TOP NEÓN"];
            for (var i = 0; i < 3; i++) {
                var x = W / 2 + (i - 1) * 520;
                card(c, IMG[picks[i]], x, 590, 440, 550, b(1 + i * 0.5), b(1.25), s0);
                var lb = text(c, labels[i], { font: F.label, size: 16, tracking: 300, color: C.grey, x: x, y: 920, justify: "center" });
                revealUp(lb, b(2 + i * 0.5), b(1), { basedOn: 1, dist: 14 });
            }
        }},

        { name: "S07_Instructor", bars: 2, trans: "push", build: function (c, s0) {
            image(c, IMG["roy-portrait"], { x: 1440, w: 960, feather: 240, zoom: 1.08, drift: [0, 20], sceneStart: s0 });
            eyebrow(c, "TU INSTRUCTOR", 140, 300, C.red, 0);
            var h = text(c, "Conoce a\rBarberRoy.", { font: F.display, size: 130, leading: 130, x: 140, y: 450 });
            revealUp(h, b(0.5), b(1.5), { basedOn: 4, blur: 20 });
            var stats = [[4, "M+", "Seguidores"], [5, "K+", "Alumnos"], [10, "+", "Años"]];
            for (var i = 0; i < 3; i++) {
                var x = 140 + i * 230, tIn = b(2.5 + i * 0.5);
                var n = counter(c, { font: F.display, size: 80, color: C.white, x: x, y: 800, name: "Stat " + stats[i][2] },
                                0, stats[i][0], tIn, b(2), "", stats[i][1]);
                revealUp(n, tIn, b(0.75), { basedOn: 1, dist: 30 });
                var lb = text(c, stats[i][2].toUpperCase(), { font: F.label, size: 16, tracking: 260, color: C.grey, x: x + 4, y: 850 });
                revealUp(lb, tIn + b(0.5), b(0.75), { basedOn: 1, dist: 14 });
            }
        }},

        { name: "S08_Stage", bars: 1, trans: "blur", build: function (c, s0) {
            image(c, IMG["roy-stage"], { zoom: 1.14, drift: [30, 0], sceneStart: s0 });
            var shade = rect(c, "Shade", W / 2, 890, W, 380, C.black, 0);
            shade.property("ADBE Transform Group").property("ADBE Opacity").setValue(55);
            eyebrow(c, "EN VIVO · EN TARIMA", 96, 900, C.red, 0);
            var t = text(c, "Mira la técnica en acción.", { font: F.body, size: 56, x: 96, y: 980 });
            revealUp(t, b(0.5), b(1.25), { basedOn: 3 });
        }},

        { name: "S09_Statement", bars: 2, trans: "cut", build: function (c, s0) {
            solid(c, C.paper, "BG Paper");
            var tag = text(c, "BARBERROY  /  COLORIMETRÍA", { font: F.label, size: 16, tracking: 200, color: C.redDeep, x: 140, y: 250, name: "Tag" });
            revealUp(tag, 0, b(1), { basedOn: 1, dist: 12 });
            var h = text(c, "CONVIÉRTETE\rEN EL COLORISTA\rQUE COBRA MÁS.", { font: F.display, size: 140, leading: 140, color: C.redDeep, x: 140, y: 440 });
            revealUp(h, b(0.5), b(2), { basedOn: 4, dist: 90 });
            line(c, "Underline", 140, 860, 200, C.redDeep, 4, b(3), b(1));
            ring(c, "Ring", 1520, 540, 460, C.redDeep, 3, b(1), b(4));
        }},

        { name: "S10_Offer", bars: 2, trans: "push", build: function (c, s0) {
            image(c, IMG["students-certificates"], { x: 1488, w: 864, feather: 260, zoom: 1.08, drift: [-30, 0], sceneStart: s0 });
            eyebrow(c, "OFERTA DE LANZAMIENTO", 140, 280, C.red, 0);
            var old = text(c, "USD $297", { font: F.display, size: 70, color: C.grey, x: 140, y: 400, name: "Old price" });
            revealUp(old, b(0.5), b(1), { basedOn: 1, dist: 30 });
            line(c, "Strike", 136, 375, 290, C.red, 6, b(1.5), b(0.75));
            var price = text(c, "$70 USD", { font: F.display, size: 230, color: C.white, x: 130, y: 640, name: "Price" });
            revealBlur(price, b(2), b(1.25));
            var perks = text(c, "Acceso de por vida  ·  Clases en vivo  ·  7 días de garantía",
                             { font: F.body, size: 26, color: C.grey, x: 140, y: 740 });
            revealUp(perks, b(3.5), b(1.5), { basedOn: 3, dist: 20 });
        }},

        { name: "S11_EndCard", bars: 2, trans: "zoom", build: function (c, s0) {
            var bg = image(c, IMG["roy-beauty-fair"], { zoom: 1.06, sceneStart: s0 });
            bg.property("ADBE Transform Group").property("ADBE Opacity").setValue(22);
            var h = text(c, "BARBERROY\rACADEMY", { font: F.display, size: 150, leading: 140, x: W / 2, y: 430, justify: "center" });
            revealBlur(h, 0, b(1.5));
            line(c, "Divider", W / 2 - 100, 600, 200, C.red, 3, b(1.5), b(1));
            var cta = text(c, "Inscríbete hoy", { font: F.bodyB, size: 44, x: W / 2, y: 700, justify: "center" });
            revealUp(cta, b(2), b(1), { basedOn: 3, dist: 30 });
            var ig = text(c, "@_barberroy_", { font: F.label, size: 20, tracking: 300, color: C.grey, x: W / 2, y: 770, justify: "center" });
            revealUp(ig, b(2.5), b(1), { basedOn: 1, dist: 14 });
        }}
    ];

    // ------------------------------------------------------------------
    // Assemble MAIN
    // ------------------------------------------------------------------
    var TRANS = b(1);           // transition length: one beat
    var total = CONFIG.offset;
    var i;
    for (i = 0; i < SCENES.length; i++) { total += SCENES[i].bars * BAR; }
    total += b(2);              // tail to let the end card breathe / fade

    var main = newComp(MAIN_NAME, total, fRoot);

    // CONTROL null — live tempo values used by every beat-pulse expression.
    var ctrl = main.layers.addNull(total);
    ctrl.name = "CONTROL";
    function slider(layer, name, v) {
        var s = layer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        s.name = name;
        s.property("ADBE Slider Control-0001").setValue(v);
    }
    slider(ctrl, "BPM", CONFIG.bpm);
    slider(ctrl, "Downbeat Offset (s)", CONFIG.offset);
    slider(ctrl, "Beat Pulse %", CONFIG.beatPulse);

    var layers = [];
    var start = CONFIG.offset;
    for (i = 0; i < SCENES.length; i++) {
        var sc = SCENES[i];
        var len = sc.bars * BAR;
        var isLast = i === SCENES.length - 1;
        // Precomp runs a transition beat past its slot so the next scene can
        // overlap it; the last one runs to the end of MAIN.
        var compLen = isLast ? total - start : len + TRANS;
        // The first scene also covers the lead-in before the first downbeat.
        if (i === 0) { compLen += start; }
        var c = newComp(sc.name, compLen, fScenes);
        solid(c, C.black, "BG");
        sc.build(c, i === 0 ? 0 : start);
        var L = main.layers.add(c);
        L.startTime = (i === 0) ? 0 : start;
        L.outPoint = L.startTime + compLen;
        L.motionBlur = true;
        layers.push(L);
        var m = new MarkerValue(sc.name);
        main.markerProperty.setValueAtTime(L.startTime, m);
        start += len;
    }
    // Transitions — keyframed on the precomp layers in MAIN.
    for (i = 1; i < layers.length; i++) {
        var inL = layers[i], outL = layers[i - 1];
        var t0 = inL.startTime, t1 = t0 + TRANS;
        var tIn = inL.property("ADBE Transform Group"), tOut = outL.property("ADBE Transform Group");
        var type = SCENES[i].trans;
        if (type === "cut") {
            outL.outPoint = t0;   // hard cut on the downbeat
        } else if (type === "push") {
            keys(tIn.property("ADBE Position"), [[t0, [W * 1.5, H / 2]], [t1, [W / 2, H / 2]]], 92);
            keys(tOut.property("ADBE Position"), [[t0, [W / 2, H / 2]], [t1, [-W / 2, H / 2]]], 92);
            outL.outPoint = t1;
        } else if (type === "zoom") {
            keys(tIn.property("ADBE Scale"), [[t0, [125, 125]], [t1, [100, 100]]], 90);
            keys(tIn.property("ADBE Opacity"), [[t0, 0], [t0 + TRANS * 0.6, 100]], 60);
            keys(tOut.property("ADBE Scale"), [[t0, [100, 100]], [t1, [88, 88]]], 90);
            outL.outPoint = t1;
        } else if (type === "blur") {
            var fb = inL.property("ADBE Effect Parade").addProperty("ADBE Box Blur2");
            fb.name = "Transition Blur";
            keys(fb.property("ADBE Box Blur2-0001"), [[t0, 60], [t1, 0]], 85);
            try { fb.property("ADBE Box Blur2-0004").setValue(1); } catch (e2) {} // repeat edge pixels
            keys(tIn.property("ADBE Opacity"), [[t0, 0], [t0 + TRANS * 0.5, 100]], 60);
            outL.outPoint = t1;
        } else if (type === "wipe") {
            var wp = inL.property("ADBE Effect Parade").addProperty("ADBE Linear Wipe");
            wp.name = "Transition Wipe";
            keys(wp.property("ADBE Linear Wipe-0001"), [[t0, 100], [t1, 0]], 88);
            wp.property("ADBE Linear Wipe-0002").setValue(270);
            wp.property("ADBE Linear Wipe-0003").setValue(160);
            outL.outPoint = t1;
        }
    }

    // Fade to black on the last bar.
    var lastL = layers[layers.length - 1];
    keys(lastL.property("ADBE Transform Group").property("ADBE Opacity"), [[total - b(2), 100], [total, 0]], 50);

    // Music + beat grid markers.
    if (music) {
        var ml = main.layers.add(music);
        ml.name = "MUSIC";
        ml.moveToEnd();
        ml.outPoint = Math.min(ml.outPoint, total);
        try {
            keys(ml.property("ADBE Audio Group").property("ADBE Audio Levels"),
                 [[total - b(4), [0, 0]], [total, [-48, -48]]], 40);
        } catch (e3) {}
    }
    var grid = main.layers.addNull(total);
    grid.name = "BEAT GRID";
    grid.moveToEnd();
    var beatN = 0;
    for (var bt = CONFIG.offset; bt < total; bt += BEAT) {
        var isBar = beatN % CONFIG.beatsPerBar === 0;
        var mk = new MarkerValue(isBar ? "Bar " + (beatN / CONFIG.beatsPerBar + 1) : "");
        try { mk.label = isBar ? 1 : 0; } catch (e4) {}
        grid.property("ADBE Marker").setValueAtTime(bt, mk);
        beatN++;
    }

    // Put CONTROL on top for easy access.
    ctrl.moveToBeginning();

    main.openInViewer();
    app.endUndoGroup();

    alert("BarberRoy promo built.\n\n" +
          SCENES.length + " scenes, " + total.toFixed(2) + "s at " + CONFIG.bpm + " BPM.\n" +
          (music ? "Music: " + music.name : "No music found in ./audio. Add a track and re-run,\nor drag one into " + MAIN_NAME + " and line it up with BEAT GRID."));
}());
