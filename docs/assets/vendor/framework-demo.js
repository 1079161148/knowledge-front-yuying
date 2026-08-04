/* ===== 框架对比 Demo 通用运行器 =====
 * 用法（在 demo HTML 里）：
 *   FrameworkDemo(document.getElementById('app'), [
 *     {
 *       label: 'Vue 3',
 *       code: '显示的源码字符串',
 *       mount: function(el){ // 真正挂载到 el，返回清理函数（可选）
 *         const app = Vue.createApp({ template: '...', setup(){...} });
 *         app.mount(el);
 *         return function(){ app.unmount(); };
 *       }
 *     },
 *     { label:'Vue 2', code:'...', mount:function(el){ const vm=new Vue({el:el,template:'...'}); return ()=>vm.$destroy(); } },
 *     { label:'React', code:'...', mount:function(el){
 *         const src = 'function App(){ return (<>...</>); }';
 *         const out = BabprevEl.transform(src,{presets:['react']}).code;
 *         const holder={v:null};
 *         new Function('React','ReactDOM','el','h', out + '\n;h.v=ReactDOM.createRoot(el);h.v.render(React.createElement(App));')(React,ReactDOM,el,holder);
 *         return function(){ if(holder.v) holder.v.unmount(); };
 *       }
 *     }
 *   ]);
 */
(function () {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.FrameworkDemo = function (mountPoint, demos) {
    if (!mountPoint || !Array.isArray(demos)) return;
    const wrap = document.createElement('div');
    wrap.className = 'fd';

    const tabs = document.createElement('div');
    tabs.className = 'fd-tabs';

    const body = document.createElement('div');
    body.className = 'fd-body';

    const codeEl = document.createElement('pre');
    codeEl.className = 'fd-code';

    const prevEl = document.createElement('div');
    prevEl.className = 'fd-preview';

    body.appendChild(codeEl);
    body.appendChild(prevEl);
    wrap.appendChild(tabs);
    wrap.appendChild(body);
    mountPoint.appendChild(wrap);

    let active = -1;
    const cleaners = [];

    demos.forEach(function (d, i) {
      const b = document.createElement('button');
      b.className = 'fd-tab';
      b.type = 'button';
      b.textContent = d.label;
      b.addEventListener('click', function () { activate(i); });
      tabs.appendChild(b);
    });

    function activate(i) {
      if (i === active) return;
      if (cleaners[active]) {
        try { cleaners[active](); } catch (e) {}
      }
      cleaners[active] = null;
      // 每个框架用独立子容器挂载：避免 Vue2 替换 el 破坏 .fd-preview，并确保切换时彻底清理
      while (prevEl.firstChild) prevEl.removeChild(prevEl.firstChild);
      const mountNode = document.createElement('div');
      mountNode.className = 'fd-mount';
      prevEl.appendChild(mountNode);
      active = i;
      const tabBtns = tabs.children;
      for (let j = 0; j < tabBtns.length; j++) {
        tabBtns[j].classList.toggle('fd-active', j === i);
      }
      const d = demos[i];
      codeEl.innerHTML = '<code>' + esc(d.code) + '</code>';
      try {
        cleaners[i] = d.mount ? d.mount(mountNode) || null : null;
      } catch (e) {
        mountNode.className = 'fd-mount fd-error';
        mountNode.innerHTML = '<pre>' + esc(String(e && e.stack ? e.stack : e)) + '</pre>';
      }
    }

    activate(0);
  };
})();
