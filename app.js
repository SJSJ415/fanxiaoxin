(() => {
  "use strict";

  const views = {
    overview: {
      index: "空间原型 01",
      zone: "三德范村",
      title: "扮玩江湖",
      subtitle: "芯子戏台 · 七馆两区",
      summary:
        "以芯子戏台为视觉核心，江湖初探・非遗传承区与拾遗归隐・文化休闲区分别展开，形成文化导入、深度体验、休闲停留与收益反哺的完整村游空间。",
      items: [
        {
          icon: "核",
          title: "一核｜芯子戏台",
          detail: "扮玩文化核心舞台 · 戏服变装 · AR 实景剧",
          featured: true,
        },
        {
          icon: "馆",
          title: "七馆｜江湖初探・非遗传承区",
          detail: "扮玩、家谱、胡同、石刻、钱币、档案与非遗手作",
        },
        {
          icon: "闲",
          title: "五区｜拾遗归隐・文化休闲区",
          detail: "客栈、茶社、非遗集市、文创商店与儿童乐园",
        },
        {
          icon: "途",
          title: "一条可完成的江湖游线",
          detail: "看戏、集图谱、做手作、逛集市、留下回访理由",
        },
      ],
      note: "轻量空间原型 · 用于预览村落更新、游客动线与业态布局",
    },
    heritage: {
      index: "空间原型 02",
      zone: "江湖初探",
      title: "非遗传承区",
      subtitle: "七馆环游 · 五张基础图谱",
      summary:
        "作为游客第一体验区，承担游客集散、文化科普与身份激活。完成七馆体验并集齐五张基础图谱后，可获得“五陵豪气”称号和下一区域游玩资格。",
      items: [
        {
          icon: "戏",
          title: "扮玩文化博物馆",
          detail: "数字戏台 · 声音档案馆 · 经典剧目",
          featured: true,
        },
        {
          icon: "德",
          title: "乡村记忆民俗馆",
          detail: "三德家谱 · 家训家规 · 村民口述",
        },
        {
          icon: "巷",
          title: "江湖农民记忆馆",
          detail: "胡同漫游 · 老钟表 · 旧农具",
        },
        {
          icon: "石",
          title: "江湖特色石刻馆",
          detail: "石刻作品 · 拓印展示 · 半价拓印体验",
        },
        {
          icon: "钱",
          title: "三德范钱庄",
          detail: "游戏币兑换 · 货币历史 · 村内消费节点",
        },
        {
          icon: "档",
          title: "江湖档案馆",
          detail: "书籍文稿 · 地契账簿 · 齐鲁古道记忆",
        },
        {
          icon: "艺",
          title: "非遗手作体验馆",
          detail: "黑陶 · 鲁绣 · 面塑 · 珐琅 · 拓印",
        },
      ],
      note: "每项体验对应民俗图纸，七馆串联形成轻量但完整的文化导入路径",
    },
    leisure: {
      index: "空间原型 03",
      zone: "拾遗归隐",
      title: "文化休闲区",
      subtitle: "住宿、茶饮与集市",
      summary:
        "聚焦游客深度消费与额外休闲需求，通过住宿、茶饮、集市、文创和亲子体验延长停留时间，形成更长的消费链与持续回访理由。",
      items: [
        {
          icon: "宿",
          title: "江湖客栈",
          detail: "铁匠铺、戏班后台等 RPG 主题客房",
          featured: true,
        },
        {
          icon: "茶",
          title: "拾遗茶社",
          detail: "方言评书会 · 节气茶宴 · 游客点播互动",
        },
        {
          icon: "集",
          title: "非遗集市",
          detail: "黑陶香插 · 铁艺风铃 · 章丘特色小吃",
        },
        {
          icon: "创",
          title: "江湖文创商店",
          detail: "地方手作 · 三德范主题文创 · 旱池与扮玩记忆",
        },
        {
          icon: "童",
          title: "三德范儿童乐园",
          detail: "木制亭台 · 民俗石刻 · 亲子文化游乐空间",
        },
      ],
      note: "休闲区把一次节庆访问延伸为住宿、餐饮、集市与亲子消费",
    },
    stage: {
      index: "核心空间 01",
      zone: "霓裳门",
      title: "芯子戏台",
      subtitle: "扮玩文化核心舞台",
      summary:
        "芯子戏台位于七馆与休闲区之间，是整个空间的主视觉和叙事起点。这里既是经典扮玩剧目演出场，也是游客完成角色变装与领取进阶任务的核心节点。",
      items: [
        {
          icon: "台",
          title: "核心舞台",
          detail: "戏服变装馆 · 古风写真 · 《芯子传奇》AR 实景剧",
          featured: true,
        },
        {
          icon: "演",
          title: "扮玩巡演",
          detail: "秧歌 · 高跷 · 舞狮 · 节假日与周末上演",
        },
        {
          icon: "图",
          title: "进阶任务",
          detail: "收集九张进阶图谱 · 学习扮玩 · 传承人奖励",
        },
        {
          icon: "证",
          title: "九天赤子",
          detail: "高阶成就称号 · 非遗传承人签名“江湖认证”",
        },
      ],
      note: "戏台承担视觉中心、演出舞台、角色入口和任务发放四项功能",
    },
    route: {
      index: "空间动线 01",
      zone: "村游路径",
      title: "一核七馆五区",
      subtitle: "从看戏到留在村里",
      summary:
        "游客由芯子戏台进入村落叙事，向七馆收集文化线索，在手作院完成深度体验，再进入休闲区停留消费，最终回到村庄共富与非遗传承主线。",
      items: [
        {
          icon: "01",
          title: "芯子戏台",
          detail: "看一出扮玩、换一次角色、领取第一张任务图",
          featured: true,
        },
        {
          icon: "02",
          title: "非遗七馆",
          detail: "扮玩、乡村记忆、胡同、石刻、钱庄、档案与手作",
        },
        {
          icon: "03",
          title: "技艺体验",
          detail: "完成拓印、黑陶、鲁绣或面塑，带走亲手制作的作品",
        },
        {
          icon: "04",
          title: "拾遗休闲",
          detail: "喝茶听书、逛非遗集市、住主题客栈",
        },
        {
          icon: "05",
          title: "共富回望",
          detail: "看见消费如何回到手艺人与村民，开启下一次回访",
        },
      ],
      note: "动线以芯子戏台为起点，避免七馆与休闲区成为彼此分离的展示空间",
    },
  };

  const museumViews = [
    {
      index: "展馆 01",
      zone: "非遗传承区",
      title: "扮玩文化博物馆",
      subtitle: "数字戏台 · 声音档案馆",
      summary:
        "以数字戏台重现《白蛇传》《哪吒闹海》《天女散花》等扮玩经典剧目。游客每观看两部经典剧目，即可获得一张扮玩图纸；声音档案馆还能聆听老艺人讲述扮玩故事并生成方言声纹明信片。",
      items: [
        { icon: "戏", title: "数字戏台", detail: "九部经典剧目 · AR 互动屏 · 专属戏偶动画", featured: true },
        { icon: "声", title: "声音档案馆", detail: "传承人口述 · 扮玩历史 · 方言祝福" },
        { icon: "图", title: "第一张民俗图纸", detail: "完成剧目体验后获得" },
      ],
      note: "这里是游客认识三德范芯子与扮玩故事的第一站",
    },
    {
      index: "展馆 02",
      zone: "非遗传承区",
      title: "乡村记忆民俗馆",
      subtitle: "江湖三德回忆录",
      summary:
        "通过张氏、牛氏、宋氏、赵氏、单氏、王氏、齐氏等族谱与家训家规，展示三德范的“人和”传统。馆内结合村民口述影像，让游客理解三德文化如何在一代代人的日常生活中延续。",
      items: [
        { icon: "谱", title: "七本氏族谱", detail: "家族迁徙 · 村庄记忆 · 文化源流", featured: true },
        { icon: "训", title: "家训与家规", detail: "传统价值 · 邻里和善 · 当代践行" },
        { icon: "忆", title: "村民口述", detail: "新媒体影像 · 生活故事 · 乡情档案" },
      ],
      note: "完成参观可获得一张民俗图纸，并继续寻找扮玩传承人",
    },
    {
      index: "展馆 03",
      zone: "非遗传承区",
      title: "江湖农民记忆馆",
      subtitle: "胡同里的旧时光",
      summary:
        "沿胡同走入旧农具、老钟表与生活器物展陈，游客可以看、听、试，理解三德范人的劳动智慧与日常记忆。展馆强调真实物件与胡同空间，不做脱离村落语境的装饰性布景。",
      items: [
        { icon: "巷", title: "胡同漫游", detail: "真实巷道 · 石墙门洞 · 村居尺度", featured: true },
        { icon: "具", title: "旧农具与老钟表", detail: "看得见 · 听得懂 · 可以试着操作" },
        { icon: "忆", title: "农民生活档案", detail: "劳动工具 · 生活器物 · 口述记忆" },
      ],
      note: "参观完成后获得一张民俗图纸",
    },
    {
      index: "展馆 04",
      zone: "非遗传承区",
      title: "江湖特色石刻馆",
      subtitle: "石刻与拓印根据地",
      summary:
        "地面陈列石刻作品，墙面展示拓印成果。游客在这里认识石刻纹样与拓印技术，并凭参观成果获得陶文拓印馆体验优惠，把碑刻上的纹理转印到帆布包或纸张上。",
      items: [
        { icon: "石", title: "石刻作品", detail: "地方碑刻 · 民俗纹样 · 石刻记忆", featured: true },
        { icon: "拓", title: "拓印展示", detail: "上纸 · 捶打 · 上墨 · 揭取" },
        { icon: "惠", title: "联动体验", detail: "半价陶文拓印 · 民俗图纸" },
      ],
      note: "石刻馆参观结束后，前往非遗手作区完成拓印作品",
    },
    {
      index: "展馆 05",
      zone: "非遗传承区",
      title: "三德范钱庄",
      subtitle: "钱币博物馆与消费节点",
      summary:
        "游客可在这里兑换三德范江湖游戏币，用于购买食物、参与体验与文创消费。同时通过钱币图案、货币由来与地方商业记忆，理解古村商贸历史和今天的村游消费链。",
      items: [
        { icon: "币", title: "江湖游戏币", detail: "兑换 · 村内支付 · 消费联动", featured: true },
        { icon: "史", title: "钱币历史", detail: "货币由来 · 图案含义 · 地方商贸" },
        { icon: "图", title: "民俗图纸", detail: "完成钱币知识体验后获得" },
      ],
      note: "钱庄连接文化体验与村内消费，是游戏机制的真实空间节点",
    },
    {
      index: "展馆 06",
      zone: "非遗传承区",
      title: "江湖档案馆",
      subtitle: "三德范村史与旧闻",
      summary:
        "档案馆收藏三德范出版的书籍、文稿、地契、账簿、粮票与村庄资料。这里把齐鲁古道、村落沿革和普通人的生活记录放在一起，构成游客理解“三德旧闻”的资料入口。",
      items: [
        { icon: "档", title: "村庄档案", detail: "书籍 · 文稿 · 村庄沿革", featured: true },
        { icon: "契", title: "地契与账簿", detail: "土地记忆 · 家庭经济 · 时代生活" },
        { icon: "道", title: "齐鲁古道", detail: "交通路线 · 商贸往来 · 村落形成" },
      ],
      note: "档案馆完成后获得一张民俗图纸，开启下一段江湖任务",
    },
    {
      index: "展馆 07",
      zone: "非遗传承区",
      title: "非遗手作体验馆",
      subtitle: "把非遗亲手带走",
      summary:
        "手作院集合章丘铁匠、黑陶、陶纹拓印、面塑、鲁绣、掐丝珐琅、葫芦烙画与非遗公开课。每参与一个项目，可获两张非遗技艺民俗图纸，并把自己的作品带回家。",
      items: [
        { icon: "陶", title: "黑陶与拓印", detail: "残片修复 · 陶纹帆布包", featured: true },
        { icon: "绣", title: "鲁绣与面塑", detail: "基础针法 · 戏曲人物面塑" },
        { icon: "艺", title: "更多工坊", detail: "铁匠 · 掐丝珐琅 · 葫芦烙画" },
      ],
      note: "每项手作可获得两张民俗图纸，是传承区的高参与度体验",
    },
  ];

  const title = document.querySelector("#info-title");
  const subtitle = document.querySelector("#panel-subtitle");
  const summary = document.querySelector("#panel-summary");
  const spaceList = document.querySelector("#space-list");
  const panelIndex = document.querySelector("#panel-index");
  const panelZone = document.querySelector("#panel-zone");
  const panelNote = document.querySelector("#panel-note");
  const infoCard = document.querySelector(".info-card");
  const navItems = [...document.querySelectorAll(".nav-item")];
  const pins = [...document.querySelectorAll(".landmark-pin")];
  const brandHome = document.querySelector("#brand-home");
  const focusToggle = document.querySelector("#focus-toggle");
  const fullscreenToggle = document.querySelector("#fullscreen-toggle");
  const soundToggle = document.querySelector("#sound-toggle");
  const zoomIn = document.querySelector("#zoom-in");
  const zoomOut = document.querySelector("#zoom-out");
  const zoomReset = document.querySelector("#zoom-reset");
  const toast = document.querySelector("#toast");
  const introScreen = document.querySelector("#intro-screen");
  const guideToggle = document.querySelector("#guide-toggle");
  const introClose = document.querySelector("#intro-close");
  const acceptQuest = document.querySelector("#accept-quest");
  const exploreFirst = document.querySelector("#explore-first");

  let activeView = "overview";
  let toastTimer = null;
  let audioState = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function showIntro() {
    document.body.classList.add("has-intro");
    introScreen.classList.remove("is-hidden");
    introScreen.removeAttribute("aria-hidden");
    window.setTimeout(() => acceptQuest.focus(), 80);
  }

  function hideIntro(message = "") {
    document.body.classList.remove("has-intro");
    introScreen.classList.add("is-hidden");
    introScreen.setAttribute("aria-hidden", "true");
    if (message) showToast(message);
    guideToggle.focus({ preventScroll: true });
  }

  function updateLandmarks(landmarks) {
    const byId = new Map(landmarks.map((landmark) => [landmark.id, landmark]));
    for (const pin of pins) {
      const landmark = byId.get(pin.dataset.landmark);
      if (!landmark || !landmark.visible) {
        pin.classList.remove("is-visible");
        continue;
      }
      pin.style.left = `${landmark.x}px`;
      pin.style.top = `${landmark.y}px`;
      pin.classList.add("is-visible");
    }
  }

  function makeSpaceItem(item, index) {
    const element = document.createElement("article");
    element.className = `space-item${item.featured ? " is-featured" : ""}`;
    element.style.animationDelay = `${index * 45}ms`;

    const icon = document.createElement("span");
    icon.className = "space-item__icon";
    icon.textContent = item.icon;

    const copy = document.createElement("div");
    copy.className = "space-item__copy";
    const heading = document.createElement("strong");
    heading.textContent = item.title;
    const detail = document.createElement("small");
    detail.textContent = item.detail;
    copy.append(heading, detail);
    element.append(icon, copy);
    return element;
  }

  function renderView(key, shouldToast = true) {
    const view = views[key];
    if (!view) return;
    activeView = key;
    panelIndex.textContent = view.index;
    panelZone.textContent = view.zone;
    title.textContent = view.title;
    subtitle.textContent = view.subtitle;
    summary.textContent = view.summary;
    panelNote.textContent = view.note;
    spaceList.replaceChildren(...view.items.map(makeSpaceItem));
    infoCard.classList.toggle("is-dense", view.items.length > 5);
    navItems.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === key);
    });
    infoCard.scrollTo({ top: 0, behavior: "smooth" });
    if (shouldToast) showToast(`已切换至：${view.title}`);
  }

  function renderMuseum(index) {
    const view = museumViews[index];
    if (!view) return;
    activeView = `museum-${index}`;
    panelIndex.textContent = view.index;
    panelZone.textContent = view.zone;
    title.textContent = view.title;
    subtitle.textContent = view.subtitle;
    summary.textContent = view.summary;
    panelNote.textContent = view.note;
    spaceList.replaceChildren(...view.items.map(makeSpaceItem));
    infoCard.classList.toggle("is-dense", view.items.length > 5);
    navItems.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === "heritage");
    });
    infoCard.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`已定位至：${view.title}`);
  }

  function toggleFocus() {
    const focused = document.body.classList.toggle("is-focus-mode");
    focusToggle.classList.toggle("is-active", focused);
    focusToggle.setAttribute("aria-pressed", String(focused));
    focusToggle.setAttribute("aria-label", focused ? "显示信息卡" : "专注查看场景");
    if (focused) showToast("已进入场景专注模式");
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        showToast("已进入全屏");
      } else {
        await document.exitFullscreen();
        showToast("已退出全屏");
      }
    } catch {
      showToast("当前浏览器未允许全屏");
    }
  }

  function setFocusedPin(id) {
    pins.forEach((pin) => {
      pin.classList.toggle("is-focused", Boolean(id) && pin.dataset.landmark === id);
    });
  }

  function focusScene(id) {
    setFocusedPin(id);
    window.__sandefanSceneFocus?.(id);
  }

  function focusViewScene(key) {
    const landmarkId = key === "stage" ? "stage" : key === "leisure" ? "leisure" : "";
    setFocusedPin(landmarkId);
    window.__sandefanSceneFocusView?.(key);
  }

  function resetSceneCamera(showMessage = true) {
    setFocusedPin("");
    window.__sandefanSceneReset?.();
    if (showMessage) showToast("已返回场景全景");
  }

  function createAmbientAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    const context = new AudioContextClass();
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      data[index] = last * 0.23;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const gain = context.createGain();
    gain.gain.value = 0.08;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    return { context, source, gain };
  }

  async function toggleSound() {
    if (!audioState) audioState = createAmbientAudio();
    if (!audioState) {
      showToast("当前浏览器不支持环境声音");
      return;
    }
    if (audioState.context.state === "running") {
      await audioState.context.suspend();
      soundToggle.classList.remove("is-active");
      soundToggle.setAttribute("aria-pressed", "false");
      soundToggle.setAttribute("aria-label", "开启环境声音");
      showToast("环境声音已关闭");
    } else {
      await audioState.context.resume();
      soundToggle.classList.add("is-active");
      soundToggle.setAttribute("aria-pressed", "true");
      soundToggle.setAttribute("aria-label", "关闭环境声音");
      showToast("环境声音已开启");
    }
  }

  for (const button of [...navItems, ...pins]) {
    button.addEventListener("click", () => {
      const landmark = button.dataset.landmark || "";
      if (landmark.startsWith("museum-")) {
        renderMuseum(Number(landmark.split("-")[1]));
        focusScene(landmark);
      } else if (landmark) {
        renderView(button.dataset.view);
        focusScene(landmark);
      } else {
        renderView(button.dataset.view);
        focusViewScene(button.dataset.view);
      }
    });
  }

  brandHome.addEventListener("click", () => {
    renderView("overview");
    resetSceneCamera(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  zoomIn.addEventListener("click", () => {
    window.__sandefanSceneZoom?.(0.8);
    showToast("场景已放大");
  });
  zoomOut.addEventListener("click", () => {
    window.__sandefanSceneZoom?.(1.25);
    showToast("场景已缩小");
  });
  zoomReset.addEventListener("click", () => resetSceneCamera());
  focusToggle.addEventListener("click", toggleFocus);
  fullscreenToggle.addEventListener("click", toggleFullscreen);
  soundToggle.addEventListener("click", toggleSound);
  window.addEventListener("sandefan:landmarks", (event) => updateLandmarks(event.detail));
  window.addEventListener("sandefan:camera-reset", () => setFocusedPin(""));
  window.addEventListener("sandefan:landmark-request", (event) => {
    const pin = pins.find((item) => item.dataset.landmark === event.detail?.id);
    pin?.click();
  });
  guideToggle.addEventListener("click", showIntro);
  introClose.addEventListener("click", () => hideIntro());
  exploreFirst.addEventListener("click", () => hideIntro("先看看三德范的空间布局"));
  acceptQuest.addEventListener("click", () => {
    hideIntro("江湖帖已收入行囊，范小芯与你同行");
    renderView("overview", false);
  });
  introScreen.addEventListener("click", (event) => {
    if (event.target === introScreen || event.target.classList.contains("intro-backdrop")) {
      hideIntro();
    }
  });

  window.addEventListener("keydown", (event) => {
    const keyMap = {
      "1": "overview",
      "2": "heritage",
      "3": "leisure",
      "4": "stage",
      "5": "route",
      "+": "zoom-in",
      "=": "zoom-in",
      "-": "zoom-out",
      "0": "zoom-reset",
      Escape: activeView,
    };
    if (event.key in keyMap) {
      if (event.key === "Escape" && document.body.classList.contains("is-focus-mode")) {
        toggleFocus();
      } else if (event.key === "Escape" && !introScreen.classList.contains("is-hidden")) {
        hideIntro();
      } else if (keyMap[event.key] === "zoom-in") {
        window.__sandefanSceneZoom?.(0.8);
      } else if (keyMap[event.key] === "zoom-out") {
        window.__sandefanSceneZoom?.(1.25);
      } else if (keyMap[event.key] === "zoom-reset") {
        resetSceneCamera(false);
      } else if (event.key !== "Escape") {
        renderView(keyMap[event.key]);
        focusViewScene(keyMap[event.key]);
      }
    }
  });

  renderView("overview", false);
  showIntro();
})();
