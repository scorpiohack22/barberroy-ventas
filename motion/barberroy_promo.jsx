/*
    BarberRoy Academy - Promo vertical 9:16 (1080x1920, 15 s, 30 fps)

    Uso:  After Effects > Archivo > Scripts > Ejecutar archivo de script... > barberroy_promo.jsx
    Fuentes (gratis en Google Fonts, instalalas antes de correrlo):
          Anton (Regular), Archivo (Black), Manrope (Bold)

    Escenas:
      0.0 - 3.0   Rueda de color neon + logo BARBERROY ACADEMY
      3.0 - 7.5   "DOMINA LA / COLORIMETRIA / CAPILAR"
      7.5 - 11.5  Contadores: 4M+ seguidores, 5K+ alumnos, 10+ anos
      11.5 - 15   "Y COBRA LO QUE VALES" + boton "INSCRIBETE AHORA"
*/
(function () {
    var W = 1080, H = 1920, FPS = 30, DUR = 15, CX = W / 2, CY = H / 2;

    var C = {
        bg: "#0a0a0a", white: "#ffffff",
        f1: "#ffa14a", f2: "#ff6a1a", f3: "#e3262f",
        cyan: "#2ad6ff", pink: "#ff3bb1", purple: "#d24dff",
        yellow: "#ffc41a", lime: "#bdf02a"
    };
    var FONT = { display: "Anton-Regular", head: "Archivo-Black", body: "Manrope-Bold" };

    // Rebote despues de la entrada (solo actua sobre el keyframe 2)
    var OVERSHOOT = [
        "amp = .06; freq = 2.2; decay = 7;",
        "n = 0;",
        "if (numKeys > 0) { n = nearestKey(time).index; if (key(n).time > time) n--; }",
        "if (n == 2) {",
        "  t = time - key(n).time;",
        "  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);",
        "  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);",
        "} else { value }"
    ].join("\n");

    var CENTER_ANCHOR = "r = sourceRectAtTime(time, false); [r.left + r.width / 2, r.top + r.height / 2]";

    // ---------- helpers ----------
    function rgb(h) {
        h = h.replace("#", "");
        return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
    }

    function tr(L) { return L.property("ADBE Transform Group"); }
    function scaleOf(L) { return tr(L).property("ADBE Scale"); }
    function opacityOf(L) { return tr(L).property("ADBE Opacity"); }
    function positionOf(L) { return tr(L).property("ADBE Position"); }

    // Aplica ease probando 1, 2 o 3 dimensiones segun la propiedad
    function setEase(prop, k, inInf, outInf) {
        for (var d = 1; d <= 3; d++) {
            try {
                var ei = [], eo = [];
                for (var j = 0; j < d; j++) {
                    ei.push(new KeyframeEase(0, inInf));
                    eo.push(new KeyframeEase(0, outInf));
                }
                prop.setTemporalEaseAtKey(k, ei, eo);
                return;
            } catch (e) {}
        }
    }

    // Keyframes con easy ease fuerte
    function smooth(prop, times, values) {
        prop.setValuesAtTimes(times, values);
        for (var i = 0; i < times.length; i++) {
            setEase(prop, prop.nearestKeyIndex(times[i]), 80, 80);
        }
    }

    // Entrada con rebote: key 1 con ease-out, key 2 lineal + expresion overshoot
    function popIn(prop, t, from, to, d) {
        prop.setValueAtTime(t, from);
        prop.setValueAtTime(t + d, to);
        var k1 = prop.nearestKeyIndex(t), k2 = prop.nearestKeyIndex(t + d);
        setEase(prop, k1, 33, 70);
        prop.setInterpolationTypeAtKey(k2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.BEZIER);
        prop.expression = OVERSHOOT;
    }

    function fadeUp(L, t, d, dy) {
        var p = positionOf(L), v = p.value;
        smooth(p, [t, t + d], [[v[0], v[1] + dy], [v[0], v[1]]]);
        smooth(opacityOf(L), [t, t + d], [0, 100]);
    }

    function fadeOut(layers, t, d) {
        for (var i = 0; i < layers.length; i++) {
            smooth(opacityOf(layers[i]), [t, t + d], [100, 0]);
        }
    }

    function timing(L, tin, tout) {
        L.inPoint = tin;
        L.outPoint = tout;
    }

    function addText(comp, str, o) {
        var L = comp.layers.addText(str);
        var sp = L.property("ADBE Text Properties").property("ADBE Text Document");
        var doc = sp.value;
        doc.fontSize = o.size;
        try { doc.font = o.font; } catch (e) {}
        doc.justification = ParagraphJustification.CENTER_JUSTIFY;
        if (o.tracking !== undefined) doc.tracking = o.tracking;
        if (o.outline) {
            doc.applyFill = false;
            doc.applyStroke = true;
            doc.strokeColor = rgb(o.color || C.white);
            doc.strokeWidth = o.outline;
        } else {
            doc.applyStroke = false;
            doc.applyFill = true;
            doc.fillColor = rgb(o.color || C.white);
        }
        sp.setValue(doc);
        tr(L).property("ADBE Anchor Point").expression = CENTER_ANCHOR;
        positionOf(L).setValue(o.pos);
        if (o.opacity !== undefined) opacityOf(L).setValue(o.opacity);
        if (o.tin !== undefined) timing(L, o.tin, o.tout);
        L.name = o.name || str;
        return L;
    }

    // Vectores del primer grupo de una capa de forma
    function vecs(L) {
        return L.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
    }

    function addShape(comp, name, kind, size, color, pos, roundness) {
        var L = comp.layers.addShape();
        L.name = name;
        L.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        if (kind === "ellipse") {
            vecs(L).addProperty("ADBE Vector Shape - Ellipse");
            vecs(L).property(1).property("ADBE Vector Ellipse Size").setValue(size);
        } else {
            vecs(L).addProperty("ADBE Vector Shape - Rect");
            vecs(L).property(1).property("ADBE Vector Rect Size").setValue(size);
            if (roundness) vecs(L).property(1).property("ADBE Vector Rect Roundness").setValue(roundness);
        }
        vecs(L).addProperty("ADBE Vector Graphic - Fill");
        vecs(L).property(2).property("ADBE Vector Fill Color").setValue(rgb(color));
        positionOf(L).setValue(pos);
        return L;
    }

    function fillColorOf(L) {
        return vecs(L).property(2).property("ADBE Vector Fill Color");
    }

    function addFx(L, match) {
        return L.property("ADBE Effect Parade").addProperty(match);
    }

    // Degradado fuego (#ffa14a -> #e3262f) que sigue el tamano del texto
    function fireGradient(L) {
        try {
            var e = addFx(L, "ADBE Ramp");
            e.property("ADBE Ramp-0001").expression = "r = sourceRectAtTime(time, false); [r.left, r.top]";
            e.property("ADBE Ramp-0002").setValue(rgb(C.f1));
            e.property("ADBE Ramp-0003").expression = "r = sourceRectAtTime(time, false); [r.left + r.width, r.top + r.height]";
            e.property("ADBE Ramp-0004").setValue(rgb(C.f3));
        } catch (err) {}
    }

    function glow(L, radius, intensity) {
        try {
            var e = addFx(L, "ADBE Glo2");
            e.property("ADBE Glo2-0003").setValue(radius);
            e.property("ADBE Glo2-0004").setValue(intensity);
        } catch (err) {}
    }

    function blur(L, amount) {
        try {
            addFx(L, "ADBE Gaussian Blur 2").property("ADBE Gaussian Blur 2-0001").setValue(amount);
        } catch (err) {}
    }

    // Revelado letra por letra (sube + aparece)
    function charReveal(L, t, d, dy) {
        var anims = L.property("ADBE Text Properties").property("ADBE Text Animators");
        anims.addProperty("ADBE Text Animator");
        var a = anims.property(anims.numProperties);
        a.property("ADBE Text Animator Properties").addProperty("ADBE Text Position 3D");
        a = anims.property(anims.numProperties);
        a.property("ADBE Text Animator Properties").property("ADBE Text Position 3D").setValue([0, dy, 0]);
        a.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
        a = anims.property(anims.numProperties);
        a.property("ADBE Text Animator Properties").property("ADBE Text Opacity").setValue(0);
        a.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        a = anims.property(anims.numProperties);
        var start = a.property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start");
        smooth(start, [t, t + d], [0, 100]);
    }

    function counterExpr(target, suffix, decimals) {
        var t = String(target);
        var counting = decimals ? "v.toFixed(1)" : "Math.round(v)";
        return "v = ease(time, inPoint + 0.2, inPoint + 1.5, 0, " + t + ");\n" +
               "(v < " + t + " ? " + counting + " : \"" + t + "\") + \"" + suffix + "\"";
    }

    // ---------- composicion ----------
    if (!app.project) app.newProject();
    app.beginUndoGroup("BarberRoy Promo");

    var comp = app.project.items.addComp("BarberRoy_Promo_9x16", W, H, 1, DUR, FPS);
    comp.bgColor = rgb(C.bg);
    comp.motionBlur = true;

    // ---------- fondo ----------
    var bg = comp.layers.addSolid(rgb(C.bg), "BG", W, H, 1, DUR);

    var blobA = addShape(comp, "Glow_Fuego", "ellipse", [1000, 1000], C.f2, [CX - 250, CY - 450]);
    blur(blobA, 280);
    opacityOf(blobA).setValue(40);
    blobA.blendingMode = BlendingMode.SCREEN;
    positionOf(blobA).expression = "wiggle(0.25, 260)";

    var blobB = addShape(comp, "Glow_Neon", "ellipse", [900, 900], C.cyan, [CX + 250, CY + 500]);
    blur(blobB, 280);
    opacityOf(blobB).setValue(35);
    blobB.blendingMode = BlendingMode.SCREEN;
    positionOf(blobB).expression = "wiggle(0.2, 300)";
    // El glow cambia de color con cada escena
    smooth(fillColorOf(blobB), [0, 3, 7.5, 11.5, 15],
        [rgb(C.cyan), rgb(C.pink), rgb(C.purple), rgb(C.f3), rgb(C.f3)]);

    // ---------- ESCENA 1: rueda de color + logo (0 - 3 s) ----------
    var ring = comp.layers.addNull(DUR);
    ring.name = "Rueda_CTRL";
    positionOf(ring).setValue([CX, CY]);
    smooth(tr(ring).property("ADBE Rotate Z"), [0, 3], [-40, 140]);

    var ringColors = [C.cyan, C.pink, C.purple, C.yellow, C.lime, C.f2];
    var R = 400;
    for (var i = 0; i < ringColors.length; i++) {
        var ang = (i * 60 - 90) * Math.PI / 180;
        var dot = addShape(comp, "Color_" + (i + 1), "ellipse", [190, 190], ringColors[i],
            [CX + R * Math.cos(ang), CY + R * Math.sin(ang)]);
        dot.blendingMode = BlendingMode.SCREEN;
        glow(dot, 45, 1);
        dot.parent = ring;
        popIn(scaleOf(dot), 0.05 + i * 0.07, [0, 0], [100, 100], 0.4);
        smooth(scaleOf(dot), [2.4 + i * 0.04, 2.75 + i * 0.04], [[100, 100], [0, 0]]);
        timing(dot, 0, 3);
    }

    var logo = addText(comp, "BARBERROY", { font: FONT.display, size: 170, pos: [CX, CY - 20], tin: 0, tout: 3 });
    popIn(scaleOf(logo), 0.6, [0, 0], [100, 100], 0.45);
    smooth(scaleOf(logo), [2.6, 3], [[100, 100], [135, 135]]);

    var academy = addText(comp, "ACADEMY", { font: FONT.head, size: 46, tracking: 600, color: C.f2,
        pos: [CX, CY + 95], tin: 0, tout: 3 });
    fadeUp(academy, 0.95, 0.4, 40);
    fadeOut([logo, academy], 2.65, 0.35);

    // ---------- ESCENA 2: titular (3 - 7.5 s) ----------
    var s2a = addText(comp, "DOMINA LA", { font: FONT.display, size: 130, pos: [CX, 700], tin: 3, tout: 7.5 });
    charReveal(s2a, 3.1, 0.5, 120);

    var s2b = addText(comp, "COLORIMETR\u00CDA", { font: FONT.display, size: 165, pos: [CX, 880], tin: 3, tout: 7.5 });
    fireGradient(s2b);
    glow(s2b, 70, 0.8);
    charReveal(s2b, 3.4, 0.7, 160);

    var s2c = addText(comp, "CAPILAR", { font: FONT.display, size: 175, outline: 4, pos: [CX, 1065], tin: 3, tout: 7.5 });
    charReveal(s2c, 3.8, 0.55, 160);

    var bar = addShape(comp, "Barra_Fuego", "rect", [620, 14], C.f2, [CX, 1190], 7);
    glow(bar, 30, 1);
    timing(bar, 3, 7.5);
    smooth(scaleOf(bar), [4.2, 4.8], [[0, 100], [100, 100]]);

    var s2d = addText(comp, "Curso online  \u00B7  BarberRoy Academy", { font: FONT.body, size: 44,
        opacity: 75, pos: [CX, 1290], tin: 3, tout: 7.5 });
    fadeUp(s2d, 4.5, 0.5, 40);
    smooth(opacityOf(s2d), [4.5, 5], [0, 75]);

    fadeOut([s2a, s2b, s2c, bar, s2d], 7.15, 0.35);

    // ---------- ESCENA 3: contadores (7.5 - 11.5 s) ----------
    var s3h = addText(comp, "RESULTADOS REALES", { font: FONT.head, size: 52, tracking: 400, color: C.f2,
        pos: [CX, 480], tin: 7.5, tout: 11.5 });
    fadeUp(s3h, 7.6, 0.4, 30);

    var stats = [
        { n: 4, s: "M+", dec: true, lbl: "SEGUIDORES" },
        { n: 5, s: "K+", dec: true, lbl: "ALUMNOS" },
        { n: 10, s: "+", dec: false, lbl: "A\u00D1OS DE EXPERIENCIA" }
    ];
    var s3layers = [s3h];
    for (var k = 0; k < stats.length; k++) {
        var y = 760 + k * 340;
        var tIn = 7.7 + k * 0.25;
        var num = addText(comp, "0", { font: FONT.display, size: 230, pos: [CX, y], tin: tIn, tout: 11.5,
            name: "Contador_" + stats[k].lbl });
        num.property("ADBE Text Properties").property("ADBE Text Document").expression =
            counterExpr(stats[k].n, stats[k].s, stats[k].dec);
        fireGradient(num);
        glow(num, 60, 0.7);
        popIn(scaleOf(num), tIn, [0, 0], [100, 100], 0.4);

        var lbl = addText(comp, stats[k].lbl, { font: FONT.body, size: 44, tracking: 200, opacity: 75,
            pos: [CX, y + 150], tin: tIn, tout: 11.5 });
        fadeUp(lbl, tIn + 0.2, 0.4, 30);
        smooth(opacityOf(lbl), [tIn + 0.2, tIn + 0.6], [0, 75]);
        s3layers.push(num, lbl);
    }
    fadeOut(s3layers, 11.15, 0.35);

    // ---------- ESCENA 4: CTA (11.5 - 15 s) ----------
    var s4a = addText(comp, "Y COBRA", { font: FONT.display, size: 190, outline: 5, pos: [CX, 690], tin: 11.5, tout: DUR });
    charReveal(s4a, 11.6, 0.45, 160);

    var s4b = addText(comp, "LO QUE VALES", { font: FONT.display, size: 165, pos: [CX, 880], tin: 11.5, tout: DUR });
    fireGradient(s4b);
    glow(s4b, 70, 0.9);
    charReveal(s4b, 11.9, 0.6, 160);

    var btnCtrl = comp.layers.addNull(DUR);
    btnCtrl.name = "Boton_PULSO";
    positionOf(btnCtrl).setValue([CX, 1170]);
    timing(btnCtrl, 11.5, DUR);
    scaleOf(btnCtrl).expression =
        "t = Math.max(0, time - inPoint - 1.4);\ns = 100 + 4 * Math.sin(t * 2 * Math.PI * 1.3);\n[s, s]";

    var btn = addShape(comp, "Boton", "rect", [760, 150], C.f2, [CX, 1170], 75);
    glow(btn, 50, 1.1);
    timing(btn, 11.5, DUR);
    btn.parent = btnCtrl;
    popIn(scaleOf(btn), 12.5, [0, 0], [100, 100], 0.4);

    var btnTxt = addText(comp, "INSCR\u00CDBETE AHORA", { font: FONT.head, size: 54, color: C.bg,
        pos: [CX, 1170], tin: 11.5, tout: DUR });
    btnTxt.parent = btnCtrl;
    popIn(scaleOf(btnTxt), 12.6, [0, 0], [100, 100], 0.4);

    var url = addText(comp, "royacademiaonline.co", { font: FONT.body, size: 42, opacity: 70,
        pos: [CX, 1330], tin: 11.5, tout: DUR });
    fadeUp(url, 13, 0.4, 30);
    smooth(opacityOf(url), [13, 13.4], [0, 70]);

    var cupos = addText(comp, "CUPOS LIMITADOS", { font: FONT.head, size: 40, tracking: 300, color: C.yellow,
        pos: [CX, 1430], tin: 13.3, tout: DUR });
    opacityOf(cupos).expression = "Math.round(time * 2) % 2 == 0 ? 100 : 35";

    // ---------- flashes de transicion ----------
    var cuts = [3, 7.5, 11.5];
    for (var c = 0; c < cuts.length; c++) {
        var flash = comp.layers.addSolid(rgb(C.f2), "Flash_" + (c + 1), W, H, 1, DUR);
        flash.blendingMode = BlendingMode.SCREEN;
        smooth(opacityOf(flash), [cuts[c] - 0.08, cuts[c], cuts[c] + 0.3], [0, 40, 0]);
        timing(flash, cuts[c] - 0.1, cuts[c] + 0.35);
    }

    // ---------- grano de pelicula ----------
    var grain = comp.layers.addSolid([1, 1, 1], "Grano", W, H, 1, DUR);
    grain.adjustmentLayer = true;
    try { addFx(grain, "ADBE Noise").property("ADBE Noise-0001").setValue(4); } catch (e) {}

    // ---------- motion blur en todo ----------
    for (var m = 1; m <= comp.numLayers; m++) {
        try { comp.layer(m).motionBlur = true; } catch (e) {}
    }

    comp.openInViewer();
    app.endUndoGroup();
    alert("Listo: comp 'BarberRoy_Promo_9x16' creada.\nDale espacio (barra espaciadora) para previsualizar.");
})();
