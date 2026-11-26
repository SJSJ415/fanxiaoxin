(() => {
  "use strict";

  const canvas = document.querySelector("#scene-canvas");
  if (!canvas) return;

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return;

  const state = {
    started: performance.now(),
    drag: false,
    lastX: 0,
    moved: false,
    pointerStartX: 0,
    pointerStartY: 0,
    pointers: new Map(),
    projectedLandmarks: [],
    thetaOffset: 0,
    targetThetaOffset: 0,
  };

  const cameraHome = {
    theta: -0.08,
    phi: 0.96,
    radius: 40.5,
    target: [0, 2.0, 0.4],
  };
  const camera = {
    theta: cameraHome.theta,
    phi: cameraHome.phi,
    radius: cameraHome.radius,
    target: [...cameraHome.target],
  };
  const cameraGoal = {
    theta: cameraHome.theta,
    phi: cameraHome.phi,
    radius: cameraHome.radius,
    target: [...cameraHome.target],
  };
  window.__sandefanSceneDebug = {
    version: "zoom-focus-1",
    camera,
    cameraGoal,
    landmarkWorlds: [],
  };

  const hallAngles = [
    Math.PI / 4,
    (Math.PI * 3) / 4,
    Math.PI,
    (Math.PI * 5) / 4,
    (Math.PI * 3) / 2,
    (Math.PI * 7) / 4,
    0,
  ];
  const landmarkWorlds = [
    { id: "stage", position: [0, 6.2, 0] },
    ...hallAngles.map((angle, index) => ({
      id: `museum-${index}`,
      position: [Math.cos(angle) * 13.2, 4.8, Math.sin(angle) * 13.2],
    })),
    { id: "leisure", position: [-15.0, 5.8, 10.0] },
  ];
  window.__sandefanSceneDebug.landmarkWorlds = landmarkWorlds;

  function shortestAngle(from, to) {
    let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  function setCameraGoal({ target, radius, phi, theta }) {
    cameraGoal.target = [...target];
    cameraGoal.radius = radius;
    cameraGoal.phi = phi;
    cameraGoal.theta = theta;
    state.targetThetaOffset = 0;
  }

  function focusLandmark(id) {
    const landmark = landmarkWorlds.find((item) => item.id === id);
    if (!landmark) {
      resetCamera();
      return false;
    }
    const [x, , z] = landmark.position;
    if (id === "stage") {
      setCameraGoal({
        target: [0, 2.8, 0],
        radius: 18.5,
        phi: 1.04,
        theta: -0.08,
      });
    } else {
      setCameraGoal({
        target: [x, id === "leisure" ? 2.1 : 2.35, z],
        radius: id === "leisure" ? 16.5 : 13.8,
        phi: 1.03,
        theta: Math.atan2(-x, -z),
      });
    }
    window.__sandefanSceneDebug.focusedId = id;
    return true;
  }

  function resetCamera() {
    state.targetThetaOffset = 0;
    setCameraGoal(cameraHome);
    window.__sandefanSceneDebug.focusedId = null;
    window.dispatchEvent(new CustomEvent("sandefan:camera-reset"));
  }

  function zoomCamera(factor) {
    cameraGoal.radius = Math.max(11.5, Math.min(55, cameraGoal.radius * factor));
  }

  function focusView(key) {
    if (key === "overview") {
      resetCamera();
    } else if (key === "stage") {
      focusLandmark("stage");
    } else if (key === "leisure") {
      focusLandmark("leisure");
    } else if (key === "route") {
      setCameraGoal({
        target: [0, 2.2, 1.8],
        radius: 35,
        phi: 1.0,
        theta: -0.08,
      });
    } else {
      setCameraGoal({
        target: [0, 2.1, 0.2],
        radius: 27.5,
        phi: 1.01,
        theta: -0.08,
      });
    }
    window.__sandefanSceneDebug.focusedId = key;
  }

  window.__sandefanSceneFocus = focusLandmark;
  window.__sandefanSceneReset = resetCamera;
  window.__sandefanSceneZoom = zoomCamera;
  window.__sandefanSceneFocusView = focusView;

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return [
      parseInt(clean.slice(0, 2), 16) / 255,
      parseInt(clean.slice(2, 4), 16) / 255,
      parseInt(clean.slice(4, 6), 16) / 255,
    ];
  }

  function tint(hex, factor) {
    const [r, g, b] = Array.isArray(hex) ? hex : hexToRgb(hex);
    return [Math.min(1, r * factor), Math.min(1, g * factor), Math.min(1, b * factor)];
  }

  function seed(x, z) {
    const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  class MeshBuilder {
    constructor() {
      this.positions = [];
      this.normals = [];
      this.colors = [];
      this.glows = [];
    }

    triangle(a, b, c, color, glow = 0) {
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const nx = ab[1] * ac[2] - ab[2] * ac[1];
      const ny = ab[2] * ac[0] - ab[0] * ac[2];
      const nz = ab[0] * ac[1] - ab[1] * ac[0];
      const length = Math.hypot(nx, ny, nz) || 1;
      const normal = [nx / length, ny / length, nz / length];
      const rgb = Array.isArray(color) ? color : hexToRgb(color);
      for (const point of [a, b, c]) {
        this.positions.push(...point);
        this.normals.push(...normal);
        this.colors.push(...rgb);
        this.glows.push(glow);
      }
    }

    quad(a, b, c, d, color, glow = 0) {
      this.triangle(a, b, c, color, glow);
      this.triangle(a, c, d, color, glow);
    }

    box(cx, baseY, cz, sx, sy, sz, color, options = {}) {
      const { glow = 0, rotY = 0, topColor = null } = options;
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);
      const point = (x, y, z) => [
        cx + x * cos + z * sin,
        baseY + y,
        cz - x * sin + z * cos,
      ];
      const hx = sx / 2;
      const hz = sz / 2;
      const a = point(-hx, 0, -hz);
      const b = point(hx, 0, -hz);
      const c = point(hx, sy, -hz);
      const d = point(-hx, sy, -hz);
      const e = point(-hx, 0, hz);
      const f = point(hx, 0, hz);
      const g = point(hx, sy, hz);
      const h = point(-hx, sy, hz);
      this.quad(a, b, c, d, color, glow);
      this.quad(f, e, h, g, color, glow);
      this.quad(e, a, d, h, color, glow);
      this.quad(b, f, g, c, color, glow);
      this.quad(d, c, g, h, topColor || color, glow);
    }

    cylinder(cx, baseY, cz, radius, height, segments, color, options = {}) {
      const { taper = 1, glow = 0, cap = true } = options;
      const top = radius * taper;
      for (let index = 0; index < segments; index += 1) {
        const a0 = (index / segments) * Math.PI * 2;
        const a1 = ((index + 1) / segments) * Math.PI * 2;
        const x0 = cx + Math.cos(a0) * radius;
        const z0 = cz + Math.sin(a0) * radius;
        const x1 = cx + Math.cos(a1) * radius;
        const z1 = cz + Math.sin(a1) * radius;
        const tx0 = cx + Math.cos(a0) * top;
        const tz0 = cz + Math.sin(a0) * top;
        const tx1 = cx + Math.cos(a1) * top;
        const tz1 = cz + Math.sin(a1) * top;
        this.quad(
          [x1, baseY, z1],
          [x0, baseY, z0],
          [tx0, baseY + height, tz0],
          [tx1, baseY + height, tz1],
          color,
          glow,
        );
        if (cap) {
          this.triangle(
            [cx, baseY + height, cz],
            [tx0, baseY + height, tz0],
            [tx1, baseY + height, tz1],
            tint(color, 1.14),
            glow,
          );
        }
      }
    }

    cone(cx, baseY, cz, radius, height, segments, color, glow = 0) {
      this.cylinder(cx, baseY, cz, radius, height, segments, color, {
        taper: 0,
        cap: false,
        glow,
      });
    }

    lantern(x, y, z, scale = 1) {
      this.cylinder(x, y, z, 0.24 * scale, 0.5 * scale, 8, "#d95f27", {
        taper: 0.86,
        glow: 0.98,
      });
      this.box(x, y + 0.5 * scale, z, 0.22 * scale, 0.08 * scale, 0.22 * scale, "#e0a04e", {
        glow: 0.35,
      });
      this.box(x, y - 0.06 * scale, z, 0.18 * scale, 0.06 * scale, 0.18 * scale, "#642b22");
    }
  }

  function localPoint(cx, cz, rotation, x, z) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [cx + x * cos + z * sin, cz - x * sin + z * cos];
  }

  function addTileRoof(builder, cx, baseY, cz, width, depth, height, color, rotation = 0, strips = 12) {
    const hw = width / 2;
    const hd = depth / 2;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const point = (x, y, z) => [
      cx + x * cos + z * sin,
      baseY + y,
      cz - x * sin + z * cos,
    ];
    const dark = tint(color, 0.72);
    const mid = tint(color, 0.94);
    const light = tint(color, 1.16);

    for (let index = 0; index < strips; index += 1) {
      const x0 = -hw + (index / strips) * width;
      const x1 = -hw + ((index + 1) / strips) * width;
      const strip = index % 4 === 0 ? light : index % 3 === 0 ? dark : mid;
      builder.quad(
        point(x0, 0, -hd),
        point(x1, 0, -hd),
        point(x1, height, 0),
        point(x0, height, 0),
        strip,
      );
      builder.quad(
        point(x1, 0, hd),
        point(x0, 0, hd),
        point(x0, height, 0),
        point(x1, height, 0),
        index % 3 === 1 ? dark : mid,
      );
    }

    for (let course = 1; course <= 8; course += 1) {
      const t = course / 9;
      for (const side of [-1, 1]) {
        const z = hd * (1 - t) * side;
        const [px, pz] = localPoint(cx, cz, rotation, 0, z);
        builder.box(px, baseY + height * t - 0.025, pz, width * 0.98, 0.045, 0.075, course % 2 ? dark : mid, {
          rotY: rotation,
          topColor: light,
        });
      }
    }

    builder.box(cx, baseY + height - 0.03, cz, width * 0.94, 0.16, 0.26, "#29302e", {
      rotY: rotation,
      topColor: "#69706b",
    });
    builder.box(cx, baseY + height + 0.1, cz, width * 0.82, 0.08, 0.16, "#353b38", {
      rotY: rotation,
      topColor: "#72766f",
    });

    for (const side of [-1, 1]) {
      const [ex, ez] = localPoint(cx, cz, rotation, 0, hd * side);
      builder.box(ex, baseY - 0.08, ez, width * 1.06, 0.13, 0.22, tint(color, 0.55), {
        rotY: rotation,
        topColor: tint(color, 1.12),
      });
      builder.box(ex, baseY - 0.22, ez, width * 0.99, 0.1, 0.12, "#4b3327", {
        rotY: rotation,
      });
      const capCount = Math.max(10, Math.round(width / 0.42));
      for (let cap = 0; cap < capCount; cap += 1) {
        const localX = -width * 0.49 + (cap + 0.5) * ((width * 0.98) / capCount);
        const [tileX, tileZ] = localPoint(cx, cz, rotation, localX, hd * side * 1.005);
        builder.box(
          tileX,
          baseY - 0.16,
          tileZ,
          0.12,
          0.13,
          0.18,
          cap % 3 === 0 ? tint(color, 1.16) : tint(color, 0.76),
          { rotY: rotation, topColor: tint(color, 1.3) },
        );
      }
    }

    for (const side of [-1, 1]) {
      const [tx, tz] = localPoint(cx, cz, rotation, side * hw * 0.94, hd * 0.98);
      builder.box(tx, baseY - 0.015, tz, 0.18, 0.22, 0.38, "#343b38", {
        rotY: rotation + side * 0.3,
        topColor: "#606862",
      });
    }
  }

  function addMasonryFace(builder, x, z, rotation, width, height, offsetZ, baseY, color) {
    const rows = 5;
    const columns = 8;
    const bw = width / columns;
    const bh = height / rows;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const jitter = seed(column * 5.1 + x, row * 4.3 + z);
        const localX = -width / 2 + column * bw + bw / 2 + (row % 2 ? bw * 0.3 : 0);
        if (localX > width / 2) continue;
        const [px, pz] = localPoint(x, z, rotation, localX, offsetZ + 0.025);
        const tone = jitter > 0.7 ? tint(color, 1.12) : jitter < 0.25 ? tint(color, 0.82) : color;
        builder.box(px, baseY + row * bh + 0.04, pz, bw * (0.84 + jitter * 0.08), bh * 0.72, 0.05, tone, {
          rotY: rotation,
          topColor: tint(tone, 1.08),
        });
      }
    }
  }

  function addLatticeWindow(builder, x, z, rotation, offsetX, baseY, offsetZ, scale = 1, warm = true) {
    const [wx, wz] = localPoint(x, z, rotation, offsetX, offsetZ);
    builder.box(wx, baseY, wz, 0.72 * scale, 0.84 * scale, 0.06, "#2d2018", {
      rotY: rotation,
      topColor: "#573b29",
    });
    const [px, pz] = localPoint(x, z, rotation, offsetX, offsetZ + 0.045);
    builder.box(px, baseY + 0.08, pz, 0.56 * scale, 0.6 * scale, 0.03, warm ? "#e4a55a" : "#7f8c85", {
      rotY: rotation,
      glow: warm ? 0.62 : 0.12,
    });
    for (const side of [-1, 0, 1]) {
      const [bx, bz] = localPoint(x, z, rotation, offsetX + side * 0.2 * scale, offsetZ + 0.07);
      builder.box(bx, baseY + 0.08, bz, 0.026, 0.6 * scale, 0.02, "#62452f", {
        rotY: rotation,
      });
    }
    const [sx, sz] = localPoint(x, z, rotation, offsetX, offsetZ + 0.07);
    builder.box(sx, baseY + 0.36 * scale, sz, 0.54 * scale, 0.027, 0.02, "#62452f", {
      rotY: rotation,
    });
  }

  function addDoor(builder, x, z, rotation, baseY, offsetX = 0, scale = 1, red = true) {
    const [dx, dz] = localPoint(x, z, rotation, offsetX, 2.2 * scale);
    builder.box(dx, baseY, dz, 1.1 * scale, 1.75 * scale, 0.1, "#241714", {
      rotY: rotation,
      topColor: "#4b2f23",
    });
    for (let plank = -2; plank <= 2; plank += 1) {
      const [px, pz] = localPoint(x, z, rotation, offsetX + plank * 0.17 * scale, 2.27 * scale);
      builder.box(px, baseY + 0.08, pz, 0.035, 1.55 * scale, 0.022, "#583625", {
        rotY: rotation,
      });
    }
    if (red) {
      for (const side of [-1, 1]) {
        const [cx, cz] = localPoint(x, z, rotation, offsetX + side * 0.72 * scale, 2.26 * scale);
        builder.box(cx, baseY + 0.18, cz, 0.12 * scale, 1.25 * scale, 0.024, "#9b3026", {
          rotY: rotation,
        });
      }
    }
  }

  function addPlaque(builder, x, y, z, rotation, width = 2.2) {
    builder.box(x, y, z, width, 0.58, 0.1, "#33251b", {
      rotY: rotation,
      topColor: "#5a412a",
    });
    const [bx, bz] = localPoint(x, z, rotation, 0, 0.061);
    builder.box(bx, y + 0.09, bz, width * 0.91, 0.035, 0.025, "#d0a65e", {
      rotY: rotation,
      glow: 0.2,
    });
    builder.box(bx, y + 0.45, bz, width * 0.91, 0.035, 0.025, "#d0a65e", {
      rotY: rotation,
      glow: 0.14,
    });
    for (let mark = -1; mark <= 1; mark += 1) {
      const [mx, mz] = localPoint(x, z, rotation, mark * width * 0.18, 0.075);
      builder.box(mx, y + 0.2, mz, width * 0.075, 0.18, 0.02, "#d0a65e", {
        rotY: rotation,
        glow: 0.1,
      });
    }
  }

  function addMuseumHall(builder, x, z, rotation, variant, scale = 1) {
    const width = 5.6 * scale;
    const depth = 3.7 * scale;
    const wallHeight = 2.5 * scale;
    const stone = ["#858075", "#7d7b70", "#8b806f", "#777d76", "#8a7b69", "#7c7c72"][variant % 6];
    const roofColor = ["#59625e", "#62625b", "#555f5d", "#60645e", "#665f55", "#57605c"][variant % 6];
    builder.box(x, 0.02, z, width * 1.05, 0.32, depth * 1.06, "#948b79", {
      rotY: rotation,
      topColor: "#b2a68f",
    });
    builder.box(x, 0.32, z, width, wallHeight, depth, tint(stone, 0.9), {
      rotY: rotation,
      topColor: tint(stone, 1.1),
    });
    addMasonryFace(builder, x, z, rotation, width, wallHeight * 0.94, depth / 2, 0.36, stone);
    builder.box(x, wallHeight + 0.05, z, width * 1.04, 0.18, depth * 1.02, "#5b3e2e", {
      rotY: rotation,
    });
    addTileRoof(builder, x, wallHeight + 0.22, z, width * 1.22, depth * 1.38, 1.1 * scale, roofColor, rotation, 11);
    addLatticeWindow(builder, x, z, rotation, -width * 0.3, 1.2, depth * 0.5 + 0.055, scale, variant % 3 !== 1);
    addLatticeWindow(builder, x, z, rotation, width * 0.3, 1.2, depth * 0.5 + 0.055, scale, variant % 2 === 0);
    addDoor(builder, x, z, rotation, 0.32, 0, scale * 0.84, variant !== 3);
    const [plaqueX, plaqueZ] = localPoint(x, z, rotation, 0, depth * 0.5 + 0.09);
    addPlaque(builder, plaqueX, wallHeight - 0.03, plaqueZ, rotation, 2.25 * scale);

    for (const side of [-1, 1]) {
      const [px, pz] = localPoint(x, z, rotation, side * width * 0.48, depth * 0.56);
      builder.cylinder(px, 0.06, pz, 0.045, 2.8, 6, "#65452f");
      builder.box(px, 1.42, pz, 0.035, 1.05, 0.62, variant === 0 ? "#983a2d" : "#735038", {
        rotY: rotation,
        topColor: "#b85e40",
      });
      builder.lantern(px, 1.08, pz, 0.72);
    }

    if (variant === 3) {
      for (const [offset, h] of [
        [-1.25, 1.1],
        [0, 1.35],
        [1.25, 1.05],
      ]) {
        const [sx, sz] = localPoint(x, z, rotation, offset, depth * 0.5 + 1.15);
        builder.box(sx, 0.08, sz, 0.45, h, 0.25, "#7e8078", {
          rotY: rotation,
          topColor: "#a4a095",
        });
      }
    }
    if (variant === 5) {
      for (const side of [-1, 1]) {
        const [wx, wz] = localPoint(x, z, rotation, side * width * 0.68, -0.1);
        builder.box(wx, 0.06, wz, 1.35 * scale, 1.6, 3.15, tint(stone, 0.84), {
          rotY: rotation,
          topColor: tint(stone, 1.02),
        });
        addTileRoof(builder, wx, 1.66, wz, 1.7, 3.5, 0.7, roofColor, rotation, 7);
      }
    }
    if (variant === 6) {
      const [awningX, awningZ] = localPoint(x, z, rotation, 0, depth * 0.5 + 1.35);
      addTileRoof(builder, awningX, 2.25, awningZ, width * 0.8, 2.0, 0.45, "#6e5948", rotation, 7);
      for (const side of [-1, 1]) {
        const [postX, postZ] = localPoint(x, z, rotation, side * width * 0.32, depth * 0.5 + 1.9);
        builder.cylinder(postX, 0.05, postZ, 0.06, 2.15, 6, "#65442f");
      }
      const [kilnX, kilnZ] = localPoint(x, z, rotation, width * 0.36, -depth * 0.25);
      builder.cylinder(kilnX, 0.08, kilnZ, 0.52, 2.2, 8, "#817769", {
        taper: 0.7,
      });
      builder.cylinder(kilnX, 2.22, kilnZ, 0.38, 1.15, 8, "#6f6c62", {
        taper: 0.7,
      });
      for (const offset of [-1.15, 0.95]) {
        const [potX, potZ] = localPoint(x, z, rotation, offset, depth * 0.5 + 1.2);
        builder.cylinder(potX, 0.08, potZ, 0.3, 0.62, 8, "#775139", {
          taper: 0.72,
        });
      }
    }
  }

  function addWorkshopRow(builder) {
    const x = -10.3;
    const z = 0.1;
    builder.box(x, 0.02, z, 10.6, 0.34, 5.8, "#9b8f7b", {
      topColor: "#baad93",
    });
    builder.box(x, 0.35, z, 10.2, 3.25, 5.3, "#c5b493", {
      topColor: "#d9c7a5",
    });
    addMasonryFace(builder, x, z, 0, 10.2, 2.0, 2.65, 0.37, "#918574");
    builder.box(x, 3.45, z, 10.5, 0.2, 5.45, "#5b3d2c");
    addTileRoof(builder, x, 3.65, z, 11.8, 6.8, 1.35, "#56605c", 0, 14);

    builder.box(-10.3, 0.42, 2.72, 7.9, 2.45, 0.18, "#30251e", {
      topColor: "#5a3c2a",
    });
    for (const postX of [-14.1, -12.1, -8.5, -6.5]) {
      builder.box(postX, 0.38, 2.85, 0.17, 2.85, 0.2, "#6d4731", {
        topColor: "#8a5c3c",
      });
    }
    builder.box(-10.3, 2.55, 2.9, 8.0, 0.18, 0.22, "#6b4630");
    addLatticeWindow(builder, -10.3, z, 0, -3.4, 1.15, 2.72, 1.1, true);
    addLatticeWindow(builder, -10.3, z, 0, 3.5, 1.15, 2.72, 1.1, false);
    addDoor(builder, -10.3, z, 0, 0.36, 0.1, 0.9, true);
    addPlaque(builder, -10.3, 3.1, 2.75, 0, 3.2);

    builder.box(-13.0, 0.55, 3.25, 2.4, 0.72, 1.0, "#7d583c", {
      topColor: "#a87950",
    });
    builder.box(-13.0, 1.27, 3.2, 2.15, 0.12, 1.2, "#d3c5a6");
    builder.box(-7.9, 0.48, 3.15, 1.5, 0.52, 0.75, "#6d4b34", {
      topColor: "#97704b",
    });
    for (const [lx, lz, scale] of [
      [-14.2, 3.0, 0.9],
      [-11.1, 3.05, 0.72],
      [-6.4, 3.15, 0.95],
    ]) {
      const [px, pz] = localPoint(x, z, 0, lx - x, lz - z);
      builder.cylinder(px, 1.2, pz, 0.05, 1.5, 6, "#563725");
      builder.lantern(px, 2.5, pz, scale);
    }
  }

  function addInnAndTea(builder) {
    const x = 10.8;
    const z = 0.3;
    builder.box(x, 0.03, z, 8.7, 0.34, 5.2, "#968b79", {
      topColor: "#b0a38c",
    });
    builder.box(x, 0.37, z, 8.2, 3.1, 4.7, "#b6a58a", {
      topColor: "#cbb899",
    });
    addMasonryFace(builder, x, z, 0, 8.2, 1.8, 2.35, 0.4, "#82786c");
    addTileRoof(builder, x, 3.46, z, 9.6, 6.1, 1.2, "#59605a", 0, 12);
    for (const wx of [-2.2, 0, 2.2]) {
      addLatticeWindow(builder, x, z, 0, wx, 1.25, 2.39, 1.0, wx === 0);
    }
    addDoor(builder, x, z, 0, 0.38, -2.2, 0.9, true);
    addPlaque(builder, x, 2.75, 2.4, 0, 2.4);

    const canopyX = 11.3;
    const canopyZ = 5.8;
    for (const [px, pz] of [
      [8.8, 4.3],
      [13.8, 4.3],
      [9.1, 7.3],
      [13.6, 7.2],
    ]) {
      builder.cylinder(px, 0.06, pz, 0.07, 2.55, 6, "#65462f");
    }
    addTileRoof(builder, canopyX, 2.62, canopyZ, 5.5, 3.8, 0.55, "#d9c6a2", 0, 9);
    builder.box(11.3, 0.56, 6.25, 2.5, 0.15, 1.45, "#7a573b", {
      topColor: "#a77d52",
    });
    builder.box(11.3, 0.18, 6.25, 1.8, 0.42, 0.85, "#674732");
    for (const side of [-1, 1]) {
      builder.box(11.3 + side * 1.55, 0.08, 6.25, 0.65, 0.42, 1.1, "#77543a");
    }
    builder.lantern(9.3, 1.9, 5.95, 0.88);
    builder.lantern(13.3, 1.9, 5.95, 0.88);

    builder.box(7.25, 0.08, 5.65, 2.9, 2.15, 0.26, "#4b3528", {
      rotY: -0.16,
      topColor: "#6b4b34",
    });
    builder.box(7.18, 0.58, 5.83, 2.55, 1.4, 0.06, "#dbc7a2", {
      rotY: -0.16,
      topColor: "#ead6b3",
    });
    builder.box(7.18, 2.19, 5.84, 3.05, 0.18, 0.4, "#3a3f3b", {
      rotY: -0.16,
      topColor: "#666b64",
    });
  }

  function addLeisureCluster(builder) {
    const entries = [
      [-18.0, 12.2, 1],
      [-12.3, 16.3, 2],
      [-5.6, 18.3, 4],
      [-18.8, 18.0, 5],
      [-0.2, 19.0, 0],
    ];
    for (const [x, z, variant] of entries) {
      const rotation = Math.atan2(-x, -z);
      addMuseumHall(builder, x, z, rotation, variant, 0.82);
    }
    const canopyX = -11.6;
    const canopyZ = 16.6;
    for (const [px, pz] of [
      [-13.0, 15.7],
      [-10.2, 15.7],
      [-13.0, 17.7],
      [-10.2, 17.7],
    ]) {
      builder.cylinder(px, 0.05, pz, 0.055, 2.05, 6, "#674832");
    }
    addTileRoof(builder, canopyX, 2.1, canopyZ, 3.8, 2.8, 0.45, "#65574a", 0, 6);
    builder.box(canopyX, 0.48, canopyZ + 0.3, 1.7, 0.14, 0.9, "#7a583c");
    for (const side of [-1, 1]) {
      builder.box(canopyX + side * 1.25, 0.08, canopyZ + 0.3, 0.55, 0.38, 0.75, "#6c4e37");
    }
    const playX = -0.2;
    const playZ = 19.0;
    for (const [px, pz, h] of [
      [playX - 1.2, playZ - 0.7, 1.8],
      [playX + 1.2, playZ - 0.7, 1.4],
      [playX - 1.2, playZ + 0.7, 1.3],
      [playX + 1.2, playZ + 0.7, 1.9],
    ]) {
      builder.cylinder(px, 0.05, pz, 0.07, h, 6, "#6a4b32");
    }
    builder.box(playX, 1.58, playZ, 2.4, 0.1, 0.12, "#6a4b32");
  }

  function addLeafyTree(builder, x, z, scale = 1, palette = 0) {
    const greens = [
      ["#516b47", "#638059", "#728c62"],
      ["#5a7147", "#718653", "#82965f"],
      ["#48664d", "#5e7b57", "#718b61"],
    ][palette % 3];
    builder.cylinder(x, 0, z, 0.24 * scale, 2.7 * scale, 8, "#5c402d", {
      taper: 0.58,
    });
    builder.cylinder(x + 0.46 * scale, 1.75 * scale, z - 0.16 * scale, 0.12 * scale, 1.75 * scale, 6, "#664832", {
      taper: 0.38,
    });
    builder.cylinder(x - 0.38 * scale, 1.9 * scale, z + 0.18 * scale, 0.1 * scale, 1.5 * scale, 6, "#664832", {
      taper: 0.34,
    });
    const crowns = [
      [-0.72, 2.2, 0.12, 1.18, 1.08],
      [0.7, 2.28, -0.08, 1.12, 1.02],
      [0.02, 2.7, 0.2, 1.3, 1.0],
      [-0.38, 3.32, -0.18, 0.98, 0.88],
      [0.48, 3.45, 0.18, 0.86, 0.82],
      [0.02, 3.92, -0.06, 0.64, 0.62],
    ];
    crowns.forEach(([ox, oy, oz, radius, height], index) => {
      builder.cylinder(
        x + ox * scale,
        oy * scale,
        z + oz * scale,
        radius * scale,
        height * scale,
        7,
        greens[index % greens.length],
        { taper: 0.28 },
      );
    });
    addGrassPatch(builder, x, z, scale * 0.9, "#5c744d");
    addFlowerCluster(builder, x + 0.9 * scale, z + 0.36 * scale, scale * 0.52, palette % 2 ? "#d29a55" : "#bf6658");
  }

  function addShrub(builder, x, z, scale = 1, color = "#5f7a52") {
    builder.cylinder(x, 0.05, z, 0.52 * scale, 0.72 * scale, 7, color, {
      taper: 0.34,
    });
    builder.cylinder(x + 0.28 * scale, 0.08, z - 0.12 * scale, 0.4 * scale, 0.55 * scale, 7, tint(color, 1.09), {
      taper: 0.28,
    });
    for (let flower = 0; flower < 4; flower += 1) {
      const angle = flower * 1.7 + seed(x, z) * 2;
      builder.box(
        x + Math.cos(angle) * 0.42 * scale,
        0.42 * scale + (flower % 2) * 0.08,
        z + Math.sin(angle) * 0.42 * scale,
        0.11 * scale,
        0.08 * scale,
        0.11 * scale,
        flower % 2 ? "#d98965" : "#e2b66f",
        { glow: 0.06 },
      );
    }
  }

  function addFlowerBed(builder, x, z, length, rotation = 0, accent = "#c76e59") {
    builder.box(x, 0.03, z, length, 0.28, 0.78, "#777368", {
      rotY: rotation,
      topColor: "#99917f",
    });
    builder.box(x, 0.28, z, length * 0.94, 0.06, 0.64, "#4d5d3f", {
      rotY: rotation,
      topColor: "#6b774f",
    });
    const count = Math.max(5, Math.round(length / 0.52));
    for (let index = 0; index < count; index += 1) {
      const lx = -length * 0.43 + (index + 0.45) * ((length * 0.86) / count);
      const lz = ((index % 3) - 1) * 0.14;
      const [fx, fz] = localPoint(x, z, rotation, lx, lz);
      builder.cylinder(fx, 0.31, fz, 0.024, 0.34 + (index % 2) * 0.08, 5, "#4e683e");
      builder.box(fx, 0.61 + (index % 2) * 0.07, fz, 0.12, 0.08, 0.12, index % 3 ? accent : "#e2b56c", {
        topColor: "#f0cc86",
        glow: 0.07,
      });
      if (index % 2 === 0) {
        builder.cone(fx + 0.12, 0.31, fz - 0.1, 0.1, 0.34, 5, tint(accent, 0.7));
      }
    }
  }

  function addLanternString(builder, x, z, rotation, width = 6.4, height = 2.8) {
    const half = width / 2;
    const [leftX, leftZ] = localPoint(x, z, rotation, -half, 0);
    const [rightX, rightZ] = localPoint(x, z, rotation, half, 0);
    builder.cylinder(leftX, 0.04, leftZ, 0.07, height, 6, "#65452f");
    builder.cylinder(rightX, 0.04, rightZ, 0.07, height, 6, "#65452f");
    builder.box(x, height - 0.05, z, width, 0.06, 0.06, "#5c3d2a", {
      rotY: rotation,
    });
    for (let index = 0; index < 5; index += 1) {
      const lx = -half * 0.78 + (index / 4) * half * 1.56;
      const [lxWorld, lzWorld] = localPoint(x, z, rotation, lx, 0);
      builder.box(lxWorld, height - 0.38, lzWorld, 0.025, 0.62, 0.025, "#493026");
      builder.lantern(lxWorld, height - 0.9, lzWorld, 0.72 + (index % 2) * 0.08);
    }
  }

  function addMarketStall(builder, x, z, rotation, scale = 1, cloth = "#a84435") {
    const width = 3.2 * scale;
    const depth = 1.7 * scale;
    builder.box(x, 0.04, z, width * 1.06, 0.18, depth * 1.18, "#8a765e", {
      rotY: rotation,
      topColor: "#a98d6a",
    });
    builder.box(x, 0.24, z, width * 0.72, 0.56, 0.72, "#765139", {
      rotY: rotation,
      topColor: "#a27149",
    });
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        const [px, pz] = localPoint(x, z, rotation, sideX * width * 0.43, sideZ * depth * 0.36);
        builder.cylinder(px, 0.06, pz, 0.065 * scale, 2.18 * scale, 6, "#5c3e2b");
      }
    }
    builder.box(x, 2.14 * scale, z, width, 0.08, 0.08, "#5a3b29", {
      rotY: rotation,
    });
    addTileRoof(builder, x, 2.22 * scale, z, width * 1.08, depth * 1.24, 0.38 * scale, cloth, rotation, 7);
    for (let item = 0; item < 5; item += 1) {
      const [ix, iz] = localPoint(
        x,
        z,
        rotation,
        -width * 0.27 + item * width * 0.135,
        depth * 0.06 + (item % 2) * 0.16,
      );
      builder.box(ix, 0.82, iz, 0.24 * scale, 0.18 * scale, 0.22 * scale, item % 2 ? "#c0884d" : "#6e8a73", {
        rotY: rotation,
        topColor: item % 2 ? "#e1ac65" : "#91a98c",
      });
    }
    const [lanternX, lanternZ] = localPoint(x, z, rotation, width * 0.48, depth * 0.25);
    builder.lantern(lanternX, 1.35 * scale, lanternZ, 0.8);
  }

  function addStage(builder) {
    const cx = 0;
    const cz = 0;

    // A raised stone terrace gives the stage a believable courtyard anchor.
    builder.box(cx, 0.02, cz + 0.15, 13.0, 0.5, 8.1, "#8d8578", {
      topColor: "#b1a58f",
    });
    builder.box(cx, 0.48, cz - 0.2, 10.9, 0.23, 5.8, "#9e8263", {
      topColor: "#c2a47c",
    });
    for (let step = 0; step < 5; step += 1) {
      builder.box(cx, 0.02, cz + 3.55 + step * 0.34, 4.0 + step * 0.48, 0.16, 0.38, step % 2 ? "#a59d8a" : "#8f897b", {
        topColor: "#c3b79f",
      });
    }

    // Deep stage house, warm back screen and hand-built side wings.
    builder.box(cx, 0.68, cz - 2.35, 10.15, 3.55, 0.42, "#4a3026", {
      topColor: "#6e4b35",
    });
    builder.box(cx, 0.82, cz - 2.11, 8.45, 2.92, 0.08, "#75372d", {
      topColor: "#a54c38",
    });
    builder.box(cx, 0.88, cz - 2.02, 5.9, 2.26, 0.035, "#d5a16f", {
      glow: 0.04,
      topColor: "#e7c18d",
    });
    for (const side of [-1, 1]) {
      for (let fold = 0; fold < 5; fold += 1) {
        const fx = cx + side * (3.28 + fold * 0.22);
        builder.box(fx, 0.82, cz - 1.9, 0.16, 2.92, 3.24, fold % 2 ? "#9f3c30" : "#792d27", {
          topColor: fold % 2 ? "#c55e46" : "#a34838",
        });
      }
    }

    // Layered eave, roof ridge and painted bracket details.
    builder.box(cx, 4.24, cz + 0.08, 10.8, 0.2, 5.9, "#68402f", {
      topColor: "#916043",
    });
    addTileRoof(builder, cx, 4.43, cz + 0.08, 12.4, 7.0, 1.42, "#4d5a57", 0, 18);
    builder.box(cx, 5.72, cz + 0.08, 7.3, 0.56, 3.7, "#6f3a2e", {
      topColor: "#9b5340",
    });
    addTileRoof(builder, cx, 6.16, cz + 0.08, 8.1, 4.6, 1.08, "#465350", 0, 13);
    builder.box(cx, 7.15, cz + 0.08, 6.7, 0.15, 0.26, "#252d2b", {
      topColor: "#69716a",
    });
    for (const side of [-1, 1]) {
      const [wingX, wingZ] = localPoint(cx, cz, 0, side * 5.65, 0.58);
      builder.box(wingX, 0.62, wingZ, 3.2, 2.42, 4.5, "#8f8474", {
        topColor: "#b0a18b",
      });
      addMasonryFace(builder, wingX, wingZ, 0, 3.2, 1.7, 2.25, 0.66, "#82786b");
      addTileRoof(builder, wingX, 3.1, wingZ, 3.8, 5.25, 0.8, "#505c58", 0, 8);
      addLatticeWindow(builder, wingX, wingZ, 0, 0, 1.2, 2.3, 0.82, side > 0);
    }

    // Front columns and carved opening.
    for (const x of [-4.38, -2.25, 2.25, 4.38]) {
      builder.cylinder(cx + x, 0.58, cz + 2.16, 0.15, 3.6, 8, "#6f342a", {
        taper: 0.92,
      });
    }
    builder.box(cx, 4.08, cz + 2.16, 9.2, 0.22, 0.3, "#6a3027", {
      topColor: "#a14f3a",
    });
    for (let mark = -8; mark <= 8; mark += 1) {
      builder.box(cx + mark * 0.54, 4.34, cz + 1.76, 0.045, 0.22, 0.05, "#d2a158", {
        glow: 0.14,
      });
    }

    // Stage plaque, side boards and lanterns.
    builder.box(cx, 4.46, cz + 3.57, 4.65, 0.72, 0.12, "#35251b", {
      topColor: "#62472f",
    });
    builder.box(cx, 4.6, cz + 3.64, 4.08, 0.43, 0.035, "#c39855", {
      glow: 0.17,
      topColor: "#e0bd7c",
    });
    for (let glyph = -1; glyph <= 1; glyph += 1) {
      builder.box(cx + glyph * 0.78, 4.65, cz + 3.67, 0.42, 0.3, 0.025, "#3b291e", {
        topColor: "#65462d",
      });
      builder.box(cx + glyph * 0.78, 4.72, cz + 3.69, 0.3, 0.055, 0.018, "#d9b16c", {
        glow: 0.12,
      });
      builder.box(cx + glyph * 0.78, 4.61, cz + 3.69, 0.055, 0.24, 0.018, "#d9b16c", {
        glow: 0.1,
      });
    }
    for (const side of [-1, 1]) {
      const [bannerX, bannerZ] = localPoint(cx, cz, 0, side * 4.92, 2.72);
      builder.cylinder(bannerX, 0.06, bannerZ, 0.075, 5.05, 6, "#573b29");
      builder.box(bannerX, 3.28, bannerZ + 0.08, 0.035, 1.55, 0.94, side < 0 ? "#9e3c30" : "#b14939", {
        topColor: "#cf6549",
      });
      builder.lantern(cx + side * 3.58, 3.38, cz + 2.72, 1.08);
      builder.lantern(cx + side * 2.2, 3.18, cz + 2.56, 0.86);
    }

    // A low timber rail makes the stage read as a real performance space.
    for (const side of [-1, 1]) {
      builder.box(cx + side * 4.15, 1.04, cz + 2.4, 1.14, 0.1, 0.1, "#8e5a39");
      builder.box(cx + side * 4.15, 0.72, cz + 2.4, 1.14, 0.06, 0.06, "#75442f");
      for (const offset of [-0.48, 0, 0.48]) {
        builder.box(cx + side * 4.15 + offset, 0.62, cz + 2.4, 0.06, 0.58, 0.06, "#75442f");
      }
    }

    // Two performers and a small band populate the stage.
    for (const [fx, color, height, scale] of [
      [-1.28, "#d4e2df", 1.55, 1.08],
      [1.22, "#b33a2e", 1.48, 1.06],
      [0.03, "#e2b65f", 1.15, 0.9],
    ]) {
      builder.cylinder(fx, 0.71, cz - 0.86, 0.2 * scale, height, 8, color, {
        taper: 0.58,
      });
      builder.cylinder(fx, 0.71 + height, cz - 0.86, 0.15 * scale, 0.28 * scale, 8, "#d9b090");
      builder.cone(fx, 0.71 + height + 0.28 * scale, cz - 0.86, 0.2 * scale, 0.24 * scale, 7, "#39312c");
      for (const side of [-1, 1]) {
        builder.box(fx + side * 0.22 * scale, 0.78 + height * 0.52, cz - 0.82, 0.12 * scale, height * 0.46, 0.12 * scale, color, {
          topColor: tint(color, 1.08),
        });
      }
    }

    // Audience benches sit on the courtyard side of the steps.
    for (const x of [-3.2, 0, 3.2]) {
      builder.box(x, 0.25, cz + 4.75, 2.05, 0.16, 0.52, "#79553a", {
        topColor: "#a57549",
      });
      builder.box(x, 0.04, cz + 4.75, 1.8, 0.22, 0.3, "#4f3929");
      addVisitor(builder, x - 0.48, cz + 3.92, Math.PI, x === 0 ? "#596c62" : "#765140", 0.78);
      addVisitor(builder, x + 0.52, cz + 3.96, Math.PI, x === 3.2 ? "#9c6446" : "#5c6071", 0.74);
    }
    for (const x of [-5.5, 5.5]) {
      addPottedPlant(builder, x, cz + 3.25, 0.82);
      addShrub(builder, x + (x < 0 ? -0.65 : 0.65), cz + 3.45, 0.58, "#597348");
    }
  }

  function addGoldenTree(builder, x, z, scale = 1) {
    builder.cylinder(x, 0, z, 0.22 * scale, 3.2 * scale, 8, "#5d402d", {
      taper: 0.62,
    });
    builder.cylinder(x + 0.72 * scale, 1.9 * scale, z + 0.2 * scale, 0.12 * scale, 2.2 * scale, 6, "#64452f", {
      taper: 0.45,
    });
    for (const [ox, oy, oz, r] of [
      [-0.7, 2.8, 0, 1.45],
      [0.5, 3.35, 0.1, 1.32],
      [0.1, 4.1, -0.22, 1.05],
      [-1.2, 3.65, -0.4, 0.9],
      [1.25, 2.9, 0.45, 0.88],
    ]) {
      builder.cone(x + ox * scale, oy * scale, z + oz * scale, r * scale, 1.55 * scale, 8, oy > 3.4 ? "#ca9949" : "#aa7b3f");
    }
  }

  function addVisitor(builder, x, z, rotation, color, scale = 1) {
    builder.cylinder(x, 0.06, z, 0.105 * scale, 0.82 * scale, 6, "#35302b", {
      taper: 0.78,
    });
    builder.cylinder(x, 0.76 * scale, z, 0.17 * scale, 0.62 * scale, 7, color, {
      taper: 0.7,
    });
    builder.cylinder(x, 1.36 * scale, z, 0.12 * scale, 0.26 * scale, 7, "#d7ad8c");
    const [hx, hz] = localPoint(x, z, rotation, 0, 0.13 * scale);
    builder.box(hx, 1.59 * scale, hz, 0.3 * scale, 0.05, 0.17 * scale, "#46372e", {
      rotY: rotation,
    });
  }

  function addStoneWall(builder, x, z, width, rotation = 0) {
    builder.box(x, 0.02, z, width, 1.22, 0.5, "#7b796d", {
      rotY: rotation,
      topColor: "#999384",
    });
    addMasonryFace(builder, x, z, rotation, width, 1.02, 0.25, 0.08, "#77776c");
    addTileRoof(builder, x, 1.25, z, width * 1.03, 0.8, 0.2, "#404743", rotation, 8);
  }

  function addCourtyardRing(builder) {
    const segments = 56;
    const inner = 6.25;
    const outer = 8.1;
    for (let index = 0; index < segments; index += 1) {
      const a0 = (index / segments) * Math.PI * 2;
      const a1 = ((index + 1) / segments) * Math.PI * 2;
      const color = index % 4 === 0 ? "#c2a983" : index % 5 === 0 ? "#ad9576" : "#b79d7c";
      builder.quad(
        [Math.cos(a0) * inner, 0.035, Math.sin(a0) * inner],
        [Math.cos(a1) * inner, 0.035, Math.sin(a1) * inner],
        [Math.cos(a1) * outer, 0.035, Math.sin(a1) * outer],
        [Math.cos(a0) * outer, 0.035, Math.sin(a0) * outer],
        color,
      );
      if (index % 3 === 0) {
        const midAngle = (a0 + a1) / 2;
        builder.box(
          Math.cos(midAngle) * 7.18,
          0.045,
          Math.sin(midAngle) * 7.18,
          0.2,
          0.035,
          0.2,
          "#f0c56c",
          { glow: 0.48 },
        );
      }
    }

    for (const angle of hallAngles) {
      const start = 8.2;
      const end = 11.0;
      const halfWidth = 0.52;
      const nx = -Math.sin(angle) * halfWidth;
      const nz = Math.cos(angle) * halfWidth;
      builder.quad(
        [Math.cos(angle) * start + nx, 0.04, Math.sin(angle) * start + nz],
        [Math.cos(angle) * start - nx, 0.04, Math.sin(angle) * start - nz],
        [Math.cos(angle) * end - nx, 0.04, Math.sin(angle) * end - nz],
        [Math.cos(angle) * end + nx, 0.04, Math.sin(angle) * end + nz],
        "#c8af8c",
      );
    }
  }

  function addPottedPlant(builder, x, z, scale = 1) {
    builder.cylinder(x, 0.02, z, 0.38 * scale, 0.42 * scale, 9, "#72533a", {
      taper: 0.76,
    });
    builder.cylinder(x, 0.44 * scale, z, 0.06 * scale, 1.1 * scale, 6, "#553b28");
    for (const [ox, oy, r] of [
      [-0.23, 1.15, 0.45],
      [0.25, 1.28, 0.5],
      [0.02, 1.58, 0.42],
    ]) {
      builder.cone(x + ox * scale, oy * scale, z + 0.04, r * scale, 0.75 * scale, 7, "#5c7453");
    }
  }

  function addGrassPatch(builder, x, z, scale = 1, tintColor = "#60774f") {
    builder.cylinder(x, 0.015, z, 0.52 * scale, 0.08 * scale, 9, tint(tintColor, 0.78), {
      taper: 0.92,
    });
    for (let blade = 0; blade < 5; blade += 1) {
      const angle = blade * 1.26 + seed(x, z) * 2;
      const radius = 0.18 * scale + (blade % 2) * 0.18 * scale;
      builder.cone(
        x + Math.cos(angle) * radius,
        0.05,
        z + Math.sin(angle) * radius,
        0.13 * scale,
        0.42 * scale + (blade % 3) * 0.08,
        5,
        blade % 2 ? tintColor : tint(tintColor, 1.12),
      );
    }
  }

  function addFlowerCluster(builder, x, z, scale = 1, accent = "#c66d54") {
    addGrassPatch(builder, x, z, scale * 1.12, "#566f4b");
    for (let flower = 0; flower < 7; flower += 1) {
      const angle = flower * 2.4 + 0.5;
      const radius = 0.2 * scale + (flower % 3) * 0.12 * scale;
      const fx = x + Math.cos(angle) * radius;
      const fz = z + Math.sin(angle) * radius;
      builder.cylinder(fx, 0.16, fz, 0.018, 0.28 * scale, 4, "#49633e");
      builder.box(fx, 0.42 * scale, fz, 0.1 * scale, 0.1 * scale, 0.1 * scale, accent, {
        topColor: "#f1c479",
        glow: 0.08,
      });
    }
  }

  function addPlainHouse(builder, x, z, rotation, scale = 0.7, variant = 0) {
    const width = 4.2 * scale;
    const depth = 2.9 * scale;
    const wallHeight = 1.9 * scale;
    const stone = variant % 2 ? "#81796c" : "#76786f";
    builder.box(x, 0.02, z, width * 1.05, 0.24, depth * 1.06, "#968a76", {
      rotY: rotation,
      topColor: "#afa28c",
    });
    builder.box(x, 0.25, z, width, wallHeight, depth, tint(stone, 0.92), {
      rotY: rotation,
      topColor: tint(stone, 1.08),
    });
    addMasonryFace(builder, x, z, rotation, width, wallHeight * 0.9, depth / 2, 0.28, stone);
    builder.box(x, wallHeight + 0.28, z, width * 1.04, 0.16, depth * 1.04, "#573d2c", {
      rotY: rotation,
    });
    addTileRoof(builder, x, wallHeight + 0.43, z, width * 1.2, depth * 1.35, 0.82 * scale, variant % 3 ? "#515b56" : "#47514f", rotation, 9);
    addDoor(builder, x, z, rotation, 0.26, 0, scale * 0.65, variant === 0);
    addLatticeWindow(builder, x, z, rotation, width * 0.29, 0.85, depth * 0.5 + 0.04, scale * 0.76, variant % 2 === 0);
    if (variant === 2) {
      const [chimneyX, chimneyZ] = localPoint(x, z, rotation, width * 0.25, -depth * 0.18);
      builder.box(chimneyX, wallHeight + 0.75, chimneyZ, 0.3, 0.75, 0.32, "#6f6e65", {
        rotY: rotation,
        topColor: "#918d81",
      });
    }
  }

  function addCourtyardFurniture(builder) {
    for (const x of [-3.7, 0, 3.7]) {
      builder.box(x, 0.35, 2.4, 2.25, 0.18, 0.52, "#765439", {
        topColor: "#a17148",
      });
      builder.box(x, 0.08, 2.4, 1.95, 0.28, 0.34, "#533b2b");
    }
    for (const [x, z, scale] of [
      [-7.1, 3.7, 1.0],
      [7.0, 3.8, 0.9],
      [-4.9, 6.0, 0.74],
      [5.3, 5.7, 0.7],
    ]) {
      addPottedPlant(builder, x, z, scale);
    }
  }

  function buildScene() {
    const builder = new MeshBuilder();

    // Ground and courtyard paving.
    builder.box(0, -0.26, -1, 68, 0.3, 58, "#827b5e", {
      topColor: "#9a8d6b",
    });
    for (let row = -9; row <= 9; row += 1) {
      for (let column = -11; column <= 11; column += 1) {
        const value = seed(row, column);
        const x = column * 2.1 + (row % 2) * 0.22;
        const z = row * 2.0 + 2;
        builder.box(x, -0.04, z, 1.94, 0.055, 1.82, value > 0.72 ? "#c4ac8e" : value < 0.25 ? "#b29a7c" : "#bca486", {
          topColor: value > 0.5 ? "#d1b895" : "#c3aa8a",
        });
      }
    }
    addCourtyardRing(builder);
    addStage(builder);

    // Seven museums physically encircle the stage, with the visitor entrance left open.
    for (let variant = 0; variant < hallAngles.length; variant += 1) {
      const angle = hallAngles[variant];
      const x = Math.cos(angle) * 13.2;
      const z = Math.sin(angle) * 13.2;
      const rotation = Math.atan2(-Math.cos(angle), -Math.sin(angle));
      addMuseumHall(builder, x, z, rotation, variant, 0.96);
    }

    // A second ring of anonymous exhibition halls carries the same architectural
    // weight as the seven named museums, keeping the center visually full.
    const innerHallAngles = [10, 36, 64, 116, 144, 170, 196, 232, 264, 296, 330];
    innerHallAngles.forEach((degrees, index) => {
      const angle = (degrees * Math.PI) / 180;
      const radius = 17.8 + (index % 3) * 0.45;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotation = Math.atan2(-x, -z) + ((index % 3) - 1) * 0.08;
      addMuseumHall(builder, x, z, rotation, (index + 2) % 7, 0.76 + (index % 3) * 0.04);
    });
    for (const [x, z, variant] of [
      [-13.9, 8.0, 1],
      [13.9, 8.0, 4],
      [-13.9, -8.0, 5],
      [13.9, -8.0, 2],
    ]) {
      addMuseumHall(builder, x, z, Math.atan2(-x, -z), variant, 0.7);
    }

    const outerHouseAngles = [-160, -115, -70, -25, 20, 65, 115, 160, 205, 250, 300, 340];
    outerHouseAngles.forEach((degrees, index) => {
      const angle = (degrees * Math.PI) / 180;
      const radius = 21.8 + (index % 3) * 1.3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      addMuseumHall(
        builder,
        x,
        z,
        Math.atan2(-Math.cos(angle), -Math.sin(angle)),
        (index + 3) % 7,
        0.64 + (index % 4) * 0.035,
      );
    });

    // Layered rows of anonymous village homes create the packed roofscape
    // shown in the reference. They keep the seven named halls readable while
    // filling the ground plane with alleys, courtyards and staggered eaves.
    const denseLaneHouses = [
      [-29.5, -14.5], [-24.5, -17.0], [-19.5, -15.0], [-14.5, -18.2],
      [-9.5, -17.5], [-4.5, -21.0], [4.5, -21.0], [9.5, -17.5],
      [14.5, -18.2], [19.5, -15.0], [24.5, -17.0], [29.5, -14.5],
      [-31.0, -5.0], [-26.0, -8.0], [-21.0, -4.0], [-16.0, -0.5],
      [16.0, -0.5], [21.0, -4.0], [26.0, -8.0], [31.0, -5.0],
      [-30.5, 5.5], [-25.5, 8.5], [-20.5, 11.0], [-16.0, 15.8],
      [16.0, 15.8], [20.5, 11.0], [25.5, 8.5], [30.5, 5.5],
      [-28.5, 19.5], [-22.5, 22.0], [-16.5, 23.0], [-10.5, 24.0],
      [10.5, 24.0], [16.5, 23.0], [22.5, 22.0], [28.5, 19.5],
    ];
    denseLaneHouses.forEach(([x, z], index) => {
      const rotation = Math.atan2(-x, -z) + ((index % 5) - 2) * 0.09;
      const scale = 0.38 + (index % 4) * 0.045;
      addPlainHouse(builder, x, z, rotation, scale, index % 3);
    });

    const innerFillerHouses = [
      [-23.0, -16.0], [-19.0, -11.0], [-17.0, -6.0], [-15.0, -12.5],
      [-11.5, -15.0], [-7.0, -16.0], [-2.5, -17.0], [2.5, -17.0],
      [7.0, -16.0], [11.5, -15.0], [15.0, -12.5], [17.0, -6.0],
      [19.0, -11.0], [23.0, -16.0], [-22.0, 12.5], [-18.0, 15.0],
      [-12.0, 16.5], [-7.0, 18.0], [7.0, 18.0], [12.0, 16.5],
      [18.0, 15.0], [22.0, 12.5],
    ];
    innerFillerHouses.forEach(([x, z], index) => {
      const rotation = Math.atan2(-x, -z) + (index % 2 ? 0.08 : -0.08);
      addPlainHouse(builder, x, z, rotation, 0.34 + (index % 3) * 0.025, (index + 1) % 3);
    });

    const outerFillerHouses = [
      [-32.0, -23.0], [-26.5, -25.0], [-21.0, -23.5], [-15.5, -25.5],
      [-10.0, -23.0], [-4.5, -26.0], [1.0, -24.5], [6.5, -26.0],
      [12.0, -23.5], [17.5, -25.5], [23.0, -23.0], [28.5, -25.0],
      [-33.0, -13.5], [-33.0, -7.0], [-33.0, 0.0], [-33.0, 7.5],
      [33.0, -13.5], [33.0, -7.0], [33.0, 0.0], [33.0, 7.5],
      [-31.0, 26.0], [-25.0, 27.0], [-19.0, 28.0], [-12.5, 27.5],
      [12.5, 27.5], [19.0, 28.0], [25.0, 27.0], [31.0, 26.0],
    ];
    outerFillerHouses.forEach(([x, z], index) => {
      const rotation = Math.atan2(-x, -z) + ((index % 3) - 1) * 0.1;
      addPlainHouse(builder, x, z, rotation, 0.3 + (index % 3) * 0.025, index % 3);
    });

    addLeisureCluster(builder);
    addCourtyardFurniture(builder);
    addMarketStall(builder, -7.4, 6.55, 0.08, 0.88, "#a84637");
    addMarketStall(builder, 7.5, 6.65, -0.1, 0.9, "#b56b3e");
    addLanternString(builder, -8.1, 3.7, Math.PI / 2, 4.5, 2.65);
    addLanternString(builder, 8.2, 3.75, Math.PI / 2, 4.5, 2.65);

    // Courtyard walls, sign, trees, and visitors.
    addStoneWall(builder, -14.5, 10.3, 12.0, 0.08);
    addStoneWall(builder, 14.6, 10.2, 12.0, -0.08);
    addStoneWall(builder, -10.7, 8.0, 6.8, 0.03);
    addStoneWall(builder, 10.8, 8.0, 6.8, -0.03);
    builder.box(-9.1, 0.06, 8.5, 0.22, 3.9, 0.22, "#5e402c");
    const signs = [
      [0.0, 3.4, 3.4, 0.12],
      [0.1, 2.8, 3.0, -0.08],
      [0.2, 2.2, 3.5, 0.04],
    ];
    for (const [ox, y, width, rz] of signs) {
      builder.box(-8.7 + ox, y, 8.45, width, 0.4, 0.16, "#745438", {
        rotY: rz,
        topColor: "#9d7149",
      });
    }
    for (const [x, z, scale, palette] of [
      [-20.8, 8.2, 1.14, 0],
      [20.5, 8.6, 1.08, 1],
      [-20.2, -9.0, 1.05, 2],
      [19.8, -9.4, 1.0, 0],
      [-15.5, 12.9, 0.84, 1],
      [15.4, 13.2, 0.82, 2],
      [-27.5, -3.8, 1.1, 0],
      [27.0, -3.0, 1.05, 1],
      [-11.8, 20.0, 0.9, 2],
      [11.7, 20.3, 0.88, 0],
      [-24.0, 15.2, 0.92, 1],
      [23.5, 15.8, 0.9, 2],
    ]) {
      addLeafyTree(builder, x, z, scale, palette);
    }
    for (const [x, z, scale] of [
      [-23.0, 7.4, 1.18],
      [21.6, 8.2, 1.12],
      [-22.0, -12.3, 1.14],
      [21.8, -13.0, 1.04],
      [-6.6, 18.4, 0.86],
      [6.8, 18.5, 0.88],
    ]) {
      addGoldenTree(builder, x, z, scale);
    }
    for (const [x, z, scale, palette] of [
      [-9.8, 7.65, 0.92, 1],
      [9.8, 7.55, 0.9, 2],
      [-14.4, 4.2, 0.72, 0],
      [14.3, 4.1, 0.7, 1],
      [-6.7, 10.4, 0.66, 2],
      [6.8, 10.5, 0.68, 0],
    ]) {
      addLeafyTree(builder, x, z, scale, palette);
    }
    for (const [x, z, scale, palette] of [
      [-16.5, -16.8, 0.82, 2],
      [-8.9, -19.2, 0.76, 0],
      [-2.4, -21.0, 0.7, 1],
      [3.6, -20.8, 0.72, 2],
      [9.8, -19.0, 0.78, 1],
      [16.6, -16.5, 0.82, 0],
    ]) {
      addLeafyTree(builder, x, z, scale, palette);
    }
    addFlowerBed(builder, -10.2, 4.8, 5.6, -0.03, "#c85f59");
    addFlowerBed(builder, 10.4, 4.9, 5.6, 0.03, "#dd9152");
    addFlowerBed(builder, -16.2, 11.7, 4.5, 0.32, "#c8785d");
    addFlowerBed(builder, 16.3, 11.8, 4.5, -0.32, "#d89b54");
    addFlowerBed(builder, -5.8, 8.55, 4.2, -0.03, "#d56755");
    addFlowerBed(builder, 5.8, 8.65, 4.2, 0.03, "#e2a057");
    addFlowerBed(builder, -13.4, -2.2, 3.8, 0.6, "#c77d58");
    addFlowerBed(builder, 13.4, -2.1, 3.8, -0.6, "#d28c53");
    for (const [x, z, scale, color] of [
      [-8.9, 6.5, 0.72, "#c66d54"],
      [9.1, 6.7, 0.7, "#d39455"],
      [-7.0, 10.8, 0.62, "#b95e58"],
      [7.2, 10.7, 0.66, "#d08350"],
      [-13.2, -5.2, 0.65, "#c78a58"],
      [13.3, -5.6, 0.68, "#be6c5a"],
      [-4.2, 12.3, 0.54, "#c28a55"],
      [4.0, 12.8, 0.58, "#d29b5a"],
      [-17.5, 1.4, 0.52, "#c57c55"],
      [17.6, 1.3, 0.54, "#d1915c"],
      [-8.3, 11.9, 1.08, "#c85e55"],
      [8.4, 12.1, 1.05, "#dd9a53"],
      [-3.4, 14.3, 0.92, "#cf7657"],
      [3.3, 14.2, 0.94, "#d79b56"],
    ]) {
      addFlowerCluster(builder, x, z, scale, color);
    }
    for (let index = 0; index < 34; index += 1) {
      const angle = (index / 34) * Math.PI * 2 + 0.12;
      const radius = 16.0 + (index % 5) * 1.15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (index % 3 === 0) {
        addShrub(builder, x, z, 0.6 + (index % 2) * 0.11, index % 2 ? "#587349" : "#687b50");
      } else {
        addGrassPatch(builder, x, z, 0.58 + (index % 3) * 0.13, index % 2 ? "#5c754f" : "#68805a");
      }
    }
    for (let index = 0; index < 22; index += 1) {
      const angle = (index / 22) * Math.PI * 2 - Math.PI / 2 + 0.08;
      if (Math.abs(Math.sin(angle) - 1) < 0.32) continue;
      const radius = 25.5 + (index % 4) * 1.3;
      addLeafyTree(
        builder,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.62 + (index % 3) * 0.1,
        index,
      );
    }
    for (const [x, z, color, scale] of [
      [-4.4, 6.2, "#7a4e3d", 1.0],
      [1.8, 7.0, "#48636a", 0.94],
      [5.4, 6.8, "#b3754b", 0.92],
      [7.4, 3.6, "#596f5d", 0.9],
      [-6.2, 3.5, "#7c6650", 0.9],
      [1.8, -8.3, "#735345", 0.86],
    ]) {
      addVisitor(builder, x, z, Math.atan2(x, z), color, scale);
    }
    for (const [x, z, color, scale] of [
      [-7.9, 5.8, "#804b39", 0.82],
      [6.1, 7.9, "#5f7280", 0.86],
      [8.3, 4.5, "#9d6846", 0.82],
      [-10.5, 7.2, "#596a61", 0.84],
      [2.9, 10.1, "#a35445", 0.8],
      [-2.1, 10.7, "#576d76", 0.82],
    ]) {
      addVisitor(builder, x, z, Math.atan2(-x, -z), color, scale);
    }

    // A warm dotted visitor route in the paving.
    for (let index = 0; index < 18; index += 1) {
      const t = index / 17;
      const x = -5.4 + t * 10.8;
      const z = 7.5 - t * 4.8;
      builder.box(x, 0.03, z, 0.22, 0.03, 0.22, "#f0c66f", {
        glow: 0.82,
      });
    }

    return {
      positions: new Float32Array(builder.positions),
      normals: new Float32Array(builder.normals),
      colors: new Float32Array(builder.colors),
      glows: new Float32Array(builder.glows),
      count: builder.positions.length / 3,
    };
  }

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
    }
    return shader;
  }

  function createProgram() {
    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec3 aColor;
      attribute float aGlow;

      uniform mat4 uViewProjection;
      uniform vec3 uCameraPosition;

      varying vec3 vNormal;
      varying vec3 vColor;
      varying float vGlow;
      varying float vDepth;
      varying float vHeight;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = aNormal;
        vColor = aColor;
        vGlow = aGlow;
        vDepth = distance(aPosition, uCameraPosition);
        vHeight = aPosition.y;
        vWorldPosition = aPosition;
        gl_Position = uViewProjection * vec4(aPosition, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;

      uniform vec3 uFogColor;
      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vColor;
      varying float vGlow;
      varying float vDepth;
      varying float vHeight;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 sun = normalize(vec3(-0.5, 0.78, 0.38));
        vec3 fill = normalize(vec3(0.62, 0.26, -0.4));
        float diffuse = max(dot(normal, sun), 0.0);
        float bounce = max(dot(normal, fill), 0.0);
        float top = max(normal.y, 0.0);
        float grain = fract(sin(dot(floor(vWorldPosition * 4.1), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float softly = 0.955 + grain * 0.085;
        float brightness = max(vColor.r, max(vColor.g, vColor.b));
        float roofBand = smoothstep(0.2, 0.5, 1.0 - normal.y) * smoothstep(0.1, 0.42, 1.0 - brightness);
        float roofRib = 0.5 + 0.5 * sin((vWorldPosition.x - vWorldPosition.z) * 34.0);
        float roofCourse = 0.5 + 0.5 * sin((vWorldPosition.y + abs(vWorldPosition.z)) * 26.0);
        float roofDetail = mix(1.0, 0.84 + roofRib * 0.2 + roofCourse * 0.08, roofBand * 0.7);
        float floorBand = smoothstep(0.9, 0.98, normal.y) * smoothstep(0.5, 0.0, abs(vHeight));
        float jointX = smoothstep(0.94, 1.0, fract(vWorldPosition.x * 0.48 + vWorldPosition.z * 0.07));
        float jointZ = smoothstep(0.95, 1.0, fract(vWorldPosition.z * 0.5 - vWorldPosition.x * 0.04));
        softly *= mix(1.0, 0.89 + jointX * 0.08 + jointZ * 0.06, floorBand * 0.72);
        softly *= roofDetail;
        vec3 light = vec3(1.05, 0.86, 0.66);
        vec3 color = vColor * softly * light * (0.72 + diffuse * 0.54 + bounce * 0.14);
        color += vColor * top * 0.045;
        color += vColor * vGlow * (0.72 + 0.08 * sin(uTime * 2.2 + vWorldPosition.x));
        color += vec3(0.035, 0.025, 0.016) * smoothstep(0.0, 2.5, vHeight);
        float fog = smoothstep(34.0, 76.0, vDepth);
        color = mix(color, uFogColor, fog * 0.55);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Program link failed");
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  const program = createProgram();
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const data = buildScene();
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const stride = 10 * 4;
  const interleaved = new Float32Array(data.count * 10);
  for (let index = 0; index < data.count; index += 1) {
    const offset = index * 10;
    interleaved[offset] = data.positions[index * 3];
    interleaved[offset + 1] = data.positions[index * 3 + 1];
    interleaved[offset + 2] = data.positions[index * 3 + 2];
    interleaved[offset + 3] = data.normals[index * 3];
    interleaved[offset + 4] = data.normals[index * 3 + 1];
    interleaved[offset + 5] = data.normals[index * 3 + 2];
    interleaved[offset + 6] = data.colors[index * 3];
    interleaved[offset + 7] = data.colors[index * 3 + 1];
    interleaved[offset + 8] = data.colors[index * 3 + 2];
    interleaved[offset + 9] = data.glows[index];
  }
  gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);

  const attributes = [
    ["aPosition", 3, 0],
    ["aNormal", 3, 3 * 4],
    ["aColor", 3, 6 * 4],
    ["aGlow", 1, 9 * 4],
  ];
  for (const [name, size, offset] of attributes) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
  }

  const uniforms = {
    viewProjection: gl.getUniformLocation(program, "uViewProjection"),
    cameraPosition: gl.getUniformLocation(program, "uCameraPosition"),
    fogColor: gl.getUniformLocation(program, "uFogColor"),
    time: gl.getUniformLocation(program, "uTime"),
  };

  function perspective(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = 2 * far * near * nf;
    return out;
  }

  function normalize(vector) {
    const length = Math.hypot(...vector) || 1;
    return vector.map((value) => value / length);
  }

  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function lookAt(out, eye, target, up) {
    const z = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
    const x = normalize(cross(up, z));
    const y = cross(z, x);
    out[0] = x[0];
    out[1] = y[0];
    out[2] = z[0];
    out[3] = 0;
    out[4] = x[1];
    out[5] = y[1];
    out[6] = z[1];
    out[7] = 0;
    out[8] = x[2];
    out[9] = y[2];
    out[10] = z[2];
    out[11] = 0;
    out[12] = -dot(x, eye);
    out[13] = -dot(y, eye);
    out[14] = -dot(z, eye);
    out[15] = 1;
    return out;
  }

  function multiply(out, a, b) {
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        out[column * 4 + row] =
          a[row] * b[column * 4] +
          a[4 + row] * b[column * 4 + 1] +
          a[8 + row] * b[column * 4 + 2] +
          a[12 + row] * b[column * 4 + 3];
      }
    }
    return out;
  }

  const projection = new Float32Array(16);
  const view = new Float32Array(16);
  const viewProjection = new Float32Array(16);
  let width = 0;
  let height = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.round(window.innerWidth * dpr);
    const nextHeight = Math.round(window.innerHeight * dpr);
    if (width === nextWidth && height === nextHeight) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }

  function cameraEye() {
    const horizontal = Math.sin(camera.phi) * camera.radius;
    return [
      camera.target[0] + Math.sin(camera.theta + state.thetaOffset) * horizontal,
      camera.target[1] + Math.cos(camera.phi) * camera.radius,
      camera.target[2] + Math.cos(camera.theta + state.thetaOffset) * horizontal,
    ];
  }

  function projectLandmark(point, matrix) {
    const x = point[0];
    const y = point[1];
    const z = point[2];
    const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
    if (clipW <= 0.1) return null;
    const screenX = ((clipX / clipW) * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(clipY / clipW) * 0.5 + 0.5) * window.innerHeight;
    return {
      x: screenX,
      y: screenY,
      visible:
        screenX > 32 &&
        screenX < window.innerWidth - 32 &&
        screenY > 86 &&
        screenY < window.innerHeight - 84,
    };
  }

  function publishLandmarks() {
    const landmarks = landmarkWorlds.map((landmark) => ({
      id: landmark.id,
      ...(projectLandmark(landmark.position, viewProjection) || { visible: false }),
    }));
    state.projectedLandmarks = landmarks;
    window.dispatchEvent(new CustomEvent("sandefan:landmarks", { detail: landmarks }));
  }

  function draw(time) {
    resize();
    const aspect = width / Math.max(height, 1);
    perspective(projection, (39 * Math.PI) / 180, aspect, 0.1, 130);
    const eye = cameraEye();
    lookAt(view, eye, camera.target, [0, 1, 0]);
    multiply(viewProjection, projection, view);

    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection);
    gl.uniform3fv(uniforms.cameraPosition, new Float32Array(eye));
    gl.uniform3fv(uniforms.fogColor, new Float32Array(hexToRgb("#b98870")));
    gl.uniform1f(uniforms.time, time * 0.001);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.drawArrays(gl.TRIANGLES, 0, data.count);
    publishLandmarks();
  }

  function animate(time) {
    state.targetThetaOffset = state.drag ? state.targetThetaOffset : Math.sin((time - state.started) / 11000) * 0.025;
    state.thetaOffset += (state.targetThetaOffset - state.thetaOffset) * 0.035;
    const smoothing = 0.085;
    camera.theta += shortestAngle(camera.theta, cameraGoal.theta) * smoothing;
    camera.phi += (cameraGoal.phi - camera.phi) * smoothing;
    camera.radius += (cameraGoal.radius - camera.radius) * smoothing;
    for (let index = 0; index < camera.target.length; index += 1) {
      camera.target[index] += (cameraGoal.target[index] - camera.target[index]) * smoothing;
    }
    draw(time);
    requestAnimationFrame(animate);
  }

  function pointerDistance() {
    const points = [...state.pointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function requestNearestLandmark(x, y) {
    const nearest = state.projectedLandmarks
      .filter((landmark) => landmark.visible)
      .map((landmark) => ({
        ...landmark,
        distance: Math.hypot(landmark.x - x, landmark.y - y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!nearest || nearest.distance > 110) return;
    window.dispatchEvent(
      new CustomEvent("sandefan:landmark-request", {
        detail: { id: nearest.id },
      }),
    );
  }

  canvas.addEventListener("pointerdown", (event) => {
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (state.pointers.size === 1) {
      state.drag = true;
      state.moved = false;
      state.lastX = event.clientX;
      state.pointerStartX = event.clientX;
      state.pointerStartY = event.clientY;
    } else if (state.pointers.size === 2) {
      state.drag = false;
      state.moved = true;
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.pointers.has(event.pointerId)) return;
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.pointers.size >= 2) {
      const nextDistance = pointerDistance();
      if (state.lastPinchDistance > 0 && nextDistance > 0) {
        zoomCamera(state.lastPinchDistance / nextDistance);
      }
      state.lastPinchDistance = nextDistance;
      return;
    }
    if (!state.drag) return;
    const dx = event.clientX - state.lastX;
    if (Math.abs(event.clientX - state.pointerStartX) > 3 || Math.abs(event.clientY - state.pointerStartY) > 3) {
      state.moved = true;
    }
    const delta = dx / window.innerWidth;
    state.targetThetaOffset = Math.max(-0.16, Math.min(0.16, state.targetThetaOffset + delta * 0.34));
    state.lastX = event.clientX;
  });
  const endDrag = (event) => {
    const wasSinglePointer = state.pointers.size === 1 && state.pointers.has(event.pointerId);
    state.pointers.delete(event.pointerId);
    state.lastPinchDistance = state.pointers.size >= 2 ? pointerDistance() : 0;
    if (state.pointers.size === 1) {
      const remaining = [...state.pointers.values()][0];
      state.lastX = remaining.x;
      state.drag = state.moved;
    } else {
      state.drag = false;
    }
    if (event.type === "pointerup" && wasSinglePointer && !state.moved) {
      requestNearestLandmark(event.clientX, event.clientY);
    }
    if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomCamera(Math.exp(Math.max(-180, Math.min(180, event.deltaY)) * 0.0015));
    },
    { passive: false },
  );
  canvas.addEventListener("dblclick", () => resetCamera());
  window.addEventListener("resize", resize);

  requestAnimationFrame(animate);
})();
