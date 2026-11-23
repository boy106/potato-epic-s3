// 沙箱无 WebGL2 的最小假上下文（Proxy）。仅用于 QA 探针：让启动链走到大厅/对局。
// 渲染帧错误会被 Game.frame 的 try/catch 吞掉，不产生 pageerror。
(() => {
  const REAL_GET = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (type === "webgl2" || type === "webgl") {
      const canvas = this;
      if (!canvas.__fakeGL) {
        const t = { __canvas: canvas };
        canvas.__fakeGL = new Proxy(t, {
          get(target, prop) {
            if (typeof prop === "string" && /^[A-Z_][A-Z_0-9]*$/.test(prop)) return 1;
            if (prop === "canvas") return canvas;
            if (prop === "getShaderPrecisionFormat") return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
            if (prop === "getActiveUniform" || prop === "getActiveAttrib") return () => ({ name: "u_mock", type: 5126, size: 1 });
            if (prop === "getShaderParameter" || prop === "getProgramParameter" || prop === "getSyncParameter") return () => true;
            if (prop === "getShaderInfoLog" || prop === "getProgramInfoLog") return () => "";
            if (prop === "getSupportedExtensions") return () => [];
            if (prop === "getExtension") return () => null;
            if (prop === "getError") return () => 0;
            if (prop === "getAttribLocation" || prop === "getUniformLocation") return () => ({});
            if (/^(create|gen)/.test(prop)) return () => ({});
            if (prop === "getProgram" || prop === "getShader") return () => ({});
            if (typeof prop === "string") {
              if (!target["__f_" + prop]) target["__f_" + prop] = function () { return undefined; };
              return target["__f_" + prop];
            }
            return undefined;
          },
          set(target, prop, v) { target[prop] = v; return true; },
        });
      }
      return canvas.__fakeGL;
    }
    return REAL_GET.call(this, type, ...rest);
  };
})();
